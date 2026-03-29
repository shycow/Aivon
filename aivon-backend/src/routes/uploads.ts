import { FastifyInstance } from "fastify";
import fs from "fs";
import path from "path";
import { pipeline } from "stream";
import { promisify } from "util";

const pump = promisify(pipeline);

export default async function uploadRoutes(server: FastifyInstance) {
  // Ensure uploads directory exists
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  server.post("/", async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.status(400).send({ error: "No file uploaded" });

    const filename = `${crypto.randomUUID()}-${data.filename}`;
    const filepath = path.join(uploadDir, filename);

    await pump(data.file, fs.createWriteStream(filepath));

    return { 
      url: `http://127.0.0.1:3001/uploads/${filename}`,
      filename: data.filename,
      mimetype: data.mimetype
    };
  });

  // Static serving of uploads
  server.get("/:filename", async (request, reply) => {
    const { filename } = request.params as any;
    const filepath = path.join(uploadDir, filename);
    
    if (!fs.existsSync(filepath)) {
      return reply.status(404).send({ error: "File not found" });
    }

    const stream = fs.createReadStream(filepath);
    return reply.send(stream);
  });
}
