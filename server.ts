import { config as loadEnv } from "dotenv";
loadEnv(); // Loads .env into process.env so VITE_GENLAYER_RPC is available

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ── AI Battle Narration ──────────────────────────────────────────────────
  app.post("/api/generate_story", async (req, res) => {
    try {
      const { winner, loser, winnerRoll, loserRoll, wager } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Write a fantasy style battle story.
Players: ${winner} (Winner) vs ${loser} (Loser).
Dice Rolls: ${winnerRoll} vs ${loserRoll}.
Stake Amount: ${wager} GEN tokens.
Requirements:
1. Mention both players (you may shorten wallet addresses).
2. Mention the exact dice values.
3. Mention the stake amount (${wager} GEN).
4. Mention who won.
5. Maximum 4 sentences.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
      res.json({ story: response.text });
    } catch (error) {
      console.error("Story generation error:", error);
      res.status(500).json({ error: "Failed to generate story" });
    }
  });

  // ── GenLayer Bradbury RPC Proxy ──────────────────────────────────────────
  // Proxies all JSON-RPC calls to the real GenLayer Bradbury testnet.
  // This bypasses CORS/iframe restrictions in browser/AI Studio environments.
  // Target RPC comes from VITE_GENLAYER_RPC env var.
  app.options("/api/rpc", (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(200);
  });

  app.post("/api/rpc", async (req, res) => {
    // Add CORS headers so MetaMask and the browser can seamlessly use our proxy
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    const targetRpc = process.env.VITE_GENLAYER_RPC || "https://zksync-os-testnet-genlayer.zksync.dev";
    try {
      const response = await fetch(targetRpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });

      // Guard: if the upstream returned HTML (Cloudflare error page), surface it clearly
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await response.text();
        console.error(`RPC upstream returned non-JSON (${response.status}):`, text.slice(0, 200));
        return res.status(502).json({
          error: "RPC upstream returned a non-JSON response",
          status: response.status,
          hint: "Check VITE_GENLAYER_RPC in your .env file and ensure the RPC endpoint is reachable from the server.",
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("GenLayer RPC proxy error:", error);
      res.status(502).json({ error: "RPC proxy failed", target: targetRpc });
    }
  });

  // ── Vite / Static ────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    const rpc = process.env.VITE_GENLAYER_RPC || "https://rpc.testnet-chain.genlayer.com";
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`RPC proxy → ${rpc}`);
  });
}

startServer();
