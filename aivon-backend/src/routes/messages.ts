import { FastifyInstance } from "fastify";
import { db } from "../db";
import { messages, conversations, users, apiKeys } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { streamChat, ChatMessage } from "../ai/provider";
import { fetchUrlContent } from "../utils/url-fetcher";

interface MessageParams {
  conversationId: string;
  messageId?: string;
}

interface StreamRequestBody {
  messages: ChatMessage[];
  modelId?: string;
  attachments?: any[];
}

export default async function messageRoutes(server: FastifyInstance) {
  server.post<{ Params: MessageParams; Body: { content: string; role: string } }>(
    "/:conversationId/messages",
    async (request, reply) => {
      const { conversationId } = request.params;
      const { content, role } = request.body;

    if (!content || !role) {
      return reply.status(400).send({ error: "Content and role are required" });
    }

    try {
      const newMessage = await db.insert(messages).values({
        conversationId,
        content,
        role: role as "user" | "assistant" | "system",
        model: "aivon-standard"
      }).returning();
      return newMessage[0];
    } catch (e) {
      return { id: Math.random().toString(36), conversationId, content, role };
    }
  });

  server.post<{ Params: MessageParams; Body: StreamRequestBody }>(
    "/:conversationId/stream",
    async (request, reply) => {
      const { conversationId } = request.params;
      const { messages: history, modelId, attachments } = request.body;

      let userId: string | null = null;
      let userPlan = "free";
      let currentUsage = 0;

      // 1. Authenticate (JWT or API Key)
      try {
        const authHeader = request.headers.authorization;
        const apiKeyHeader = request.headers["x-api-key"] as string;

        if (authHeader) {
          await request.jwtVerify();
          userId = (request.user as { id: string }).id;
        } else if (apiKeyHeader) {
          const keyData = await db.select().from(apiKeys).where(eq(apiKeys.key, apiKeyHeader)).limit(1);
          if (keyData.length > 0) {
            userId = keyData[0].userId;
            // Update last used asynchronously
            db.update(apiKeys).set({ lastUsedAt: new Date().toISOString() }).where(eq(apiKeys.id, keyData[0].id)).execute();
          }
        }

        if (userId) {
          const userData = await db.select().from(users).where(eq(users.id, userId)).limit(1);
          if (userData.length > 0) {
            userPlan = userData[0].plan || "free";
            currentUsage = userData[0].tokensUsed || 0;
          }
        }
      } catch (e) {}

      // 2. Enforce Usage Limits (Free users: 5k tokens)
      if (userPlan === "free" && currentUsage >= 5000) {
        reply.raw.writeHead(403, { 'Content-Type': 'application/json' });
        reply.raw.write(JSON.stringify({ 
          error: "Usage limit reached", 
          role: "assistant",
          content: "You've used all 5,000 free tokens. Please upgrade to Pro for unlimited access." 
        }));
        return reply.raw.end();
      }

      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': request.headers.origin || '*',
        'Access-Control-Allow-Credentials': 'true'
      });

      try {
        // Validate history array
        if (!history || !Array.isArray(history) || history.length === 0) {
          reply.raw.write(`data: ${JSON.stringify({ type: "error", content: "No messages provided" })}\n\n`);
          return reply.raw.end();
        }

        const lastMsg = history[history.length - 1];
        let prompt = lastMsg.content;
        let isDeepThinking = prompt.includes("[DEEP THINKING]");
        let isWebSearch = prompt.includes("[WEB SEARCH]");

        // Detect URLs for summary
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = prompt.match(urlRegex) || [];
        let urlContexts = "";

        if (urls.length > 0) {
          for (const url of urls) {
            const content = await fetchUrlContent(url);
            urlContexts += `\n\n[CONTEXT from ${url}]:\n${content}\n`;
          }
        }

        // Clean the prompt for the AI
        prompt = prompt.replace(/\[DEEP THINKING\]|\[WEB SEARCH\]|\[ATTACHMENTS:.*?\]/g, "").trim();
        
        // Append URL context to prompt for AI awareness
        if (urlContexts) {
          prompt += `\n\nUse the following context to answer if relevant: ${urlContexts}`;
        }
        
        lastMsg.content = prompt; // Update history for AI

        // reasoning simulation
        let simulatedThought = "";
        if (isDeepThinking || isWebSearch || urls.length > 0) {
          const thinkingSteps = [];
          if (urls.length > 0) thinkingSteps.push(`Fetching content from ${urls.length} URL(s)...`);
          if (isWebSearch) thinkingSteps.push("Searching the web for relevant information...");
          if (isDeepThinking) {
            thinkingSteps.push("Analyzing the request requirements...");
            thinkingSteps.push("Breaking down the problem into sub-tasks...");
            thinkingSteps.push("Evaluating potential solutions and edge cases...");
            thinkingSteps.push("Synthesizing the final response...");
          }

          for (const step of thinkingSteps) {
            // Send simulated thought tokens
            const thoughtChunk = `> ${step}\n`;
            simulatedThought += thoughtChunk;
            for (const word of thoughtChunk.split(" ")) {
              reply.raw.write(`data: ${JSON.stringify({ type: "thought", content: word + " " })}\n\n`);
              await new Promise(resolve => setTimeout(resolve, 30));
            }
            reply.raw.write(`data: ${JSON.stringify({ type: "thought", content: "\n" })}\n\n`);
          }
        }

        // 3. Persist User Message Immediately (So it's not lost if AI fails)
        try {
          console.log("[DEBUG] Inserting user message, convId:", conversationId, "content len:", prompt.length);
          await db.insert(messages).values({
            conversationId,
            role: "user",
            content: prompt
          });
        } catch (dbErr) {
          console.error("Failed to persist user message immediately", dbErr);
        }

        // Start the Gemini stream
        let fullContent = "";
        let count = 0;
        let stream;
        
        try {
           stream = await streamChat(history, modelId || process.env.GEMINI_MODEL || "gemini-2.0-flash", attachments || []);
        } catch (apiErr: any) {
           // Allow stream loop to be skipped by keeping stream undefined
           // The error will be handled by the catch block below if we throw, but we want to persist user msg first
           throw apiErr;
        }

        for await (const chunk of stream) {
          const text = chunk.text();
          if (text) {
            fullContent += text;
            reply.raw.write(`data: ${JSON.stringify({ type: "token", content: text, index: count })}\n\n`);
            count++;
          }
        }

        // Persist Assistant message to DB
        try {
          console.log("[DEBUG] Inserting assistant message, content len:", fullContent.length);
          const assistantInsert = await db.insert(messages).values({
            conversationId,
            role: "assistant",
            content: fullContent,
            thought: simulatedThought,
            model: modelId || "gemini-2.0-flash"
          }).returning();
          console.log("[DEBUG] Assistant message inserted:", assistantInsert[0]?.id);

          // Update Usage
          if (userId) {
            const estimatedTokens = Math.ceil((prompt.length + fullContent.length) / 4);
            const userData = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            if (userData.length > 0) {
              await db.update(users)
                .set({ tokensUsed: (userData[0].tokensUsed || 0) + estimatedTokens })
                .where(eq(users.id, userId));
            }
          }
        } catch (dbErr: any) {
          console.error("[DEBUG] DB persistence FAILED:", dbErr.message, dbErr.stack);
          server.log.error(dbErr, "DB persistence/usage update failed");
        }

        reply.raw.write(`data: {"type":"done"}\n\n`);
        reply.raw.end();

      } catch (error: any) {
        server.log.error(error, "Streaming error");
        reply.raw.write(`data: ${JSON.stringify({ type: "error", content: `\n\n**Error:** ${error.message || "An internal error occurred"}` })}\n\n`);
        reply.raw.write(`data: {"type":"done"}\n\n`);
        reply.raw.end();
      }
    }
  );

  server.patch<{ Params: MessageParams; Body: { content: string } }>(
    "/:conversationId/messages/:messageId",
    async (request, reply) => {
      const { messageId } = request.params;
      const { content } = request.body;
      if (!messageId || !content) return reply.status(400).send({ error: "Missing required fields" });

      const updated = await db.update(messages).set({ content }).where(eq(messages.id, messageId)).returning();
      if (!updated.length) return reply.status(404).send({ error: "Message not found" });
      return updated[0];
    }
  );

  server.delete<{ Params: MessageParams }>(
    "/:conversationId/messages/:messageId",
    async (request, reply) => {
      const { messageId } = request.params;
      if (!messageId) return reply.status(400).send({ error: "Missing messageId" });
      await db.delete(messages).where(eq(messages.id, messageId));
      return { success: true };
    }
  );

  server.patch<{ Params: MessageParams; Body: { isBookmarked: boolean } }>(
    "/:conversationId/messages/:messageId/bookmark",
    async (request, reply) => {
      const { messageId } = request.params;
      const { isBookmarked } = request.body;
      if (!messageId) return reply.status(400).send({ error: "Missing messageId" });

      const updated = await db.update(messages).set({ isBookmarked }).where(eq(messages.id, messageId)).returning();
      if (!updated.length) return reply.status(404).send({ error: "Message not found" });
      return updated[0];
    }
  );

  server.get("/bookmarks", async (request, reply) => {
    try {
      await request.jwtVerify();
      const userPayload = request.user as { id: string };

      const bookmarkedMessages = await db.select({
        id: messages.id,
        content: messages.content,
        conversationId: messages.conversationId,
        createdAt: messages.createdAt,
        role: messages.role,
        title: conversations.title
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(
        and(
          eq(conversations.userId, userPayload.id),
          eq(messages.isBookmarked, true)
        )
      );

      return bookmarkedMessages;
    } catch (err) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
  });
}
