import { createClient } from "genlayer-js";
import type { GenLayerChain } from "genlayer-js";

// Custom chain derived from the environment variables (or defaulting to local params)
const customChain: GenLayerChain = {
  id: Number(import.meta.env.VITE_CHAIN_ID || 1337),
  name: "GenLayer Custom",
  nativeCurrency: {
    name: "GEN",
    symbol: "GEN",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_GENLAYER_RPC || "http://localhost:4000/api"],
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
