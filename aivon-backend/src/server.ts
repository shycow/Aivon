import dotenv from "dotenv";
dotenv.config();

import path from "path";
import Fastify from "fastify";
import crypto from "crypto";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import authRoutes from "./routes/auth";
import conversationRoutes from "./routes/conversations";
import messageRoutes from "./routes/messages";
import folderRoutes from "./routes/folders";
import uploadRoutes from "./routes/uploads";
import apiKeyRoutes from "./routes/api-keys";

const server = Fastify({
  logger: true,
});

server.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

server.register(jwt, {
  secret: process.env.JWT_SECRET || "aivon-omega-secret-key-2026",
});

server.register(fastifyStatic, {
  root: path.join(process.cwd(), "uploads"),
  prefix: "/uploads/",
});

server.register(cors, {
  origin: true, // Allow all origins for dev to fix "Failed to fetch"
  credentials: true,
});

server.get("/v1/health", async (request, reply) => {
  return { status: "ok", service: "aivon-api", version: "1.0.0" };
});

server.register(authRoutes, { prefix: "/v1/auth" });
server.register(conversationRoutes, { prefix: "/v1/conversations" });
server.register(messageRoutes, { prefix: "/v1/messages" });
server.register(folderRoutes, { prefix: "/v1/folders" });
server.register(uploadRoutes, { prefix: "/v1/uploads" });
server.register(apiKeyRoutes, { prefix: "/v1/api-keys" });

const PORT = parseInt(process.env.PORT || "3001", 10);

const start = async () => {
  try {
    await server.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Server listening on port ${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
