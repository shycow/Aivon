import { FastifyInstance } from "fastify";
import { db } from "../db";
import { folders, conversations } from "../db/schema";
import { eq } from "drizzle-orm";

export default async function folderRoutes(server: FastifyInstance) {
  server.get("/", async (request, reply) => {
    const all = await db.select().from(folders);
    return all;
  });

  server.post("/", async (request, reply) => {
    const { name } = request.body as any;
    if (!name) return reply.status(400).send({ error: "Name is required" });

    const newFolder = await db.insert(folders).values({
      id: crypto.randomUUID(),
      name,
    }).returning();

    return newFolder[0];
  });

  server.patch("/:id", async (request, reply) => {
    const { id } = request.params as any;
    const { name } = request.body as any;

    try {
      const updated = await db.update(folders)
        .set({ name })
        .where(eq(folders.id, id))
        .returning();
      
      if (updated.length === 0) {
        return reply.status(404).send({ error: "Folder not found" });
      }
      return updated[0];
    } catch (e: any) {
      server.log.error(e);
      return reply.status(500).send({ error: "Failed to update folder" });
    }
  });

  server.delete("/:id", async (request, reply) => {
    const { id } = request.params as any;

    try {
      // Unset folderId in conversations
      await db.update(conversations).set({ folderId: null }).where(eq(conversations.folderId, id));
      const deleted = await db.delete(folders).where(eq(folders.id, id)).returning();
      
      if (deleted.length === 0) {
        return reply.status(404).send({ error: "Folder not found" });
      }
      return { success: true };
    } catch (e: any) {
      server.log.error(e);
      return reply.status(500).send({ error: "Failed to delete folder" });
    }
  });
}
