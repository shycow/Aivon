import { FastifyInstance } from "fastify";
import { db } from "../db";
import { apiKeys } from "../db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

export default async function apiKeyRoutes(server: FastifyInstance) {
  server.addHook("preHandler", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: "Unauthorized" });
    }
  });

  server.get("/", async (request, reply) => {
    const payload = request.user as any;
    const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, payload.id));
    return keys;
  });

  server.post("/", async (request, reply) => {
    const payload = request.user as any;
    const { name } = request.body as any;
    
    const newKey = `sk_aivon_${crypto.randomBytes(24).toString("hex")}`;
    
    const created = await db.insert(apiKeys).values({
      userId: payload.id,
      key: newKey,
      name: name || "Default Key"
    }).returning();
    
    return created[0];
  });

  server.delete("/:id", async (request, reply) => {
    const payload = request.user as any;
    const { id } = request.params as any;
    
    await db.delete(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, payload.id)));
    return { success: true };
  });
}
