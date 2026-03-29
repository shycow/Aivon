import { FastifyInstance } from "fastify";
import { db } from "../db";
import { conversations, messages } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export default async function conversationRoutes(server: FastifyInstance) {
  server.get("/", async (request, reply) => {
    // Requires User context from Auth
    const all = await db.select().from(conversations).orderBy(desc(conversations.updatedAt));
    return all;
  });

  server.post("/", async (request, reply) => {
    const { title, model } = request.body as any;
    
    const newConversation = await db.insert(conversations).values({
      id: crypto.randomUUID(),
      title: title || "New conversation",
      model: model || "aivon-standard",
    }).returning();

    return newConversation[0];
  });

  server.get("/:id", async (request, reply) => {
    const { id } = request.params as any;
    
    try {
      const conversation = await db.select().from(conversations).where(eq(conversations.id, id));
      if (conversation.length === 0) {
        return reply.status(404).send({ error: "Conversation not found" });
      }

      const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
      return { ...conversation[0], messages: msgs };
    } catch (e: any) {
      server.log.error(e);
      return reply.status(500).send({ error: "Failed to fetch conversation" });
    }
  });

  server.patch("/:id", async (request, reply) => {
    const { id } = request.params as any;
    const { title, isPinned, folderId } = request.body as any;

    try {
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (isPinned !== undefined) updateData.isPinned = isPinned;
      if (folderId !== undefined) updateData.folderId = folderId;
      updateData.updatedAt = new Date().toISOString();

      const updated = await db.update(conversations)
        .set(updateData)
        .where(eq(conversations.id, id))
        .returning();
      
      if (updated.length === 0) {
        return reply.status(404).send({ error: "Conversation not found" });
      }
      return updated[0];
    } catch (e: any) {
      server.log.error(e);
      return reply.status(500).send({ error: "Failed to update conversation" });
    }
  });

  server.delete("/:id", async (request, reply) => {
    const { id } = request.params as any;

    try {
      // Delete messages first (if not cascading)
      await db.delete(messages).where(eq(messages.conversationId, id));
      const deleted = await db.delete(conversations).where(eq(conversations.id, id)).returning();
      
      if (deleted.length === 0) {
        return reply.status(404).send({ error: "Conversation not found" });
      }
      return { success: true };
    } catch (e: any) {
      server.log.error(e);
      return reply.status(500).send({ error: "Failed to delete conversation" });
    }
  });
}
