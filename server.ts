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
      const { winner, loser, winnerRoll, loserRoll, wager } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Write a fantasy style battle story. 
Players: ${winner} (Winner) vs ${loser} (Loser).
Dice Rolls: ${winnerRoll} vs ${loserRoll}.
Stake Amount: ${wager} GEN tokens.
Requirements:
1. Must mention both wallet player addresses (maybe shortened if needed, but refer to them).
2. Must mention the exact dice values.
3. Must mention the stake amount (${wager} GEN).
4. Must explicitly mention who won.
5. Maximum 4 sentences long.`;
      
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

  const rpcUrl = process.env.VITE_GENLAYER_RPC || "https://zksync-os-testnet-genlayer.zksync.dev";
  // GenLayer RPC Proxy to bypass browser CORS/iframe restrictions
  app.post("/api/rpc", async (req, res) => {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("GenLayer Proxy Error:", error);
      res.status(500).json({ error: "Failed to proxy RPC" });
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
