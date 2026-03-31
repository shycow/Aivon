import { FastifyInstance } from "fastify";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export default async function authRoutes(server: FastifyInstance) {
  server.post("/login", async (request, reply) => {
    const { email, password } = request.body as any;
    
    if (!email || !password) {
      return reply.status(400).send({ error: "Email and password required" });
    }

    const userData = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (userData.length === 0) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, userData[0].hashedPassword || "");
    if (!isMatch) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const user = userData[0];
    const token = server.jwt.sign({ id: user.id, email: user.email });

    return { token, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, plan: user.plan } };
  });

  server.post("/signup", async (request, reply) => {
    const { email, password, name } = request.body as any;

    if (!email || !password) {
      return reply.status(400).send({ error: "Email and password required" });
    }

    const existingUser = await db.select().from(users).where(eq(users.email, email));
    
    if (existingUser.length > 0) {
      return reply.status(400).send({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db.insert(users).values({
      id: crypto.randomUUID(),
      email,
      hashedPassword,
      name,
    }).returning();

    const user = newUser[0];
    const token = server.jwt.sign({ id: user.id, email: user.email });

    return { token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } };
  });

  // --- OAuth Scaffolding ---
  
  server.get("/google", async (request, reply) => {
    // In a real implementation, redirect to Google OAuth URL
    // const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&...`
    // reply.redirect(url)
    return { message: "Redirecting to Google OAuth... (Configure GOOGLE_CLIENT_ID in .env)" };
  });

  server.get("/github", async (request, reply) => {
    // In a real implementation, redirect to GitHub OAuth URL
    // const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&...`
    // reply.redirect(url)
    return { message: "Redirecting to GitHub OAuth... (Configure GITHUB_CLIENT_ID in .env)" };
  });

  server.get("/me", async (request, reply) => {
    try {
      await request.jwtVerify();
      const userPayload = request.user as any;
      const userData = await db.select().from(users).where(eq(users.id, userPayload.id)).limit(1);
      
      if (userData.length === 0) return reply.status(404).send({ error: "User not found" });
      
      const user = userData[0];
      return { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, plan: user.plan, tokensUsed: user.tokensUsed };
    } catch (err) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
  });

  server.patch("/me", async (request, reply) => {
    try {
      await request.jwtVerify();
      const userPayload = request.user as any;
      const { name, avatarUrl } = request.body as any;
      
      const updated = await db.update(users)
        .set({ name, avatarUrl })
        .where(eq(users.id, userPayload.id))
        .returning();
        
      if (!updated.length) return reply.status(404).send({ error: "User not found" });
      const user = updated[0];
      return { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, plan: user.plan };
    } catch (err) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
  });

  server.post("/avatar", async (request, reply) => {
    try {
      await request.jwtVerify();
      const userPayload = request.user as { id: string };
      
      const file = await request.file();
      if (!file) return reply.status(400).send({ error: "No file uploaded" });

      const fs = require('fs');
      const path = require('path');
      const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
      
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const filename = `${userPayload.id}-${Date.now()}${path.extname(file.filename)}`;
      const filepath = path.join(uploadDir, filename);

      await new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(filepath);
        file.file.pipe(stream);
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      const APP_URL = process.env.APP_URL || "http://127.0.0.1:3001";
      const avatarUrl = `${APP_URL}/uploads/avatars/${filename}`;
      
      await db.update(users)
        .set({ avatarUrl })
        .where(eq(users.id, userPayload.id));

      return { avatarUrl };
    } catch (err) {
      server.log.error(err);
      return reply.status(500).send({ error: "Avatar upload failed" });
    }
  });
}
