import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIVON_SYSTEM_PROMPT } from "./systemPrompt";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface FileAttachment {
  url: string;
  filename: string;
  mimetype: string;
}

export async function streamChat(messages: ChatMessage[], modelId: string, attachments: FileAttachment[] = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not defined. Please add it to your .env file.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: modelId || process.env.GEMINI_MODEL || "gemini-2.0-flash",
    systemInstruction: AIVON_SYSTEM_PROMPT,
  });

  const history = messages.slice(0, messages.length - 1).map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history });

  const lastUserMessage = messages[messages.length - 1];
  const parts: any[] = [{ text: lastUserMessage.content }];

  // Add attachments as parts
  const fs = require('fs');
  for (const file of attachments) {
    const filename = file.url.split('/').pop();
    const filepath = `./uploads/${filename}`;
    
    // Gemini natively supports images and PDFs
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
      try {
        const fileData = fs.readFileSync(filepath).toString("base64");
        parts.push({
          inlineData: {
            data: fileData,
            mimeType: file.mimetype
          }
        });
      } catch (e) {
        console.error(`Failed to read ${file.mimetype} for Gemini`, e);
      }
    } else {
      // For other text-based files, read them as text
      try {
        const stats = fs.statSync(filepath);
        if (stats.size < 500000) { // Limit to 500KB for text extraction
          const content = fs.readFileSync(filepath, 'utf8');
          parts.push({ text: `\n[FILE ATTACHED: ${file.filename}]\nContent:\n${content.slice(0, 10000)}` });
        } else {
          parts.push({ text: `\n[FILE ATTACHED: ${file.filename} (Size too large for full text)]` });
        }
      } catch (e) {
        parts.push({ text: `\n[FILE ATTACHED: ${file.filename} (${file.mimetype})]` });
      }
    }
  }

  const result = await model.generateContentStream(parts);
  return result.stream;
}
