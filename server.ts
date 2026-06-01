import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Narrative Endpoint
  app.post("/api/generate_story", async (req, res) => {
    try {
      const { winner, loser, winnerRoll, loserRoll } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Write a 2-4 sentence fun fantasy battle story. ${winner} beat ${loser}. The dice rolls were ${winnerRoll} against ${loserRoll}. Explain how the winner defeated the loser using magic or weapons. Keep it fun and family-friendly.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });
      
      res.json({ story: response.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate story" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
