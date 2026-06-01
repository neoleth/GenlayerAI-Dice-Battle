import { createClient } from "genlayer-js";
import type { GenLayerChain } from "genlayer-js";

// Custom chain derived from the environment variables (or defaulting to local params)
const customChain: GenLayerChain = {
  id: Number(import.meta.env.VITE_CHAIN_ID || 61999),
  name: "GenLayer Custom",
  nativeCurrency: {
    name: "GEN",
    symbol: "GEN",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_GENLAYER_RPC || "https://studio.genlayer.com/api"],
    },
  },
};

export const getClient = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return createClient({
      chain: customChain,
      provider: window.ethereum,
    });
  }
  return null;
};
