import { FastifyInstance } from "fastify";

/**
 * Very basic URL content fetcher.
 * In a real production app, this would use a more robust library like Puppeteer or a dedicated scraping API.
 */
export async function fetchUrlContent(url: string): Promise<string> {
  try {
    const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
    
    if (isYouTube) {
      // Mock YouTube transcript extraction
      return `[YOUTUBE DATA for ${url}]
Title: How to build Aivon Omega
Duration: 15:24
Key highlights: 
1. Architecture overview (0:00)
2. Frontend setup with Vite (3:15)
3. Backend logic with Fastify (8:45)
4. Deployment (14:00)`;
    }

    const response = await fetch(url);
    if (!response.ok) return `Failed to fetch content from ${url}`;
    
    const html = await response.text();
    
    // Simple regex to strip HTML tags (very crude)
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return text.slice(0, 5000); // Limit context size
  } catch (error: any) {
    return `Error fetching URL ${url}: ${error.message}`;
  }
}
