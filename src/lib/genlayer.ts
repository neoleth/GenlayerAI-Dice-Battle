import { createClient, chains } from "genlayer-js";

// ── GenLayer Testnet Bradbury ─────────────────────────────────────────────
// Official config: https://docs.genlayer.com/developers/networks
// Chain ID: 4221
// GenLayer RPC: https://rpc-bradbury.genlayer.com
// Explorer:     https://explorer-bradbury.genlayer.com
// Note: The /api/rpc proxy on the Express server forwards to VITE_GENLAYER_RPC
//       to avoid browser CORS restrictions when running in AI Studio.

const CHAIN_ID  = Number(import.meta.env.VITE_CHAIN_ID  || 4221);
const EXPLORER  = import.meta.env.VITE_EXPLORER || "https://explorer-bradbury.genlayer.com";

const buildChain = (): any => {
  // Try official genlayer-js chain objects first (they have consensusMainContract built in)
  const official = Object.values(chains).find((c: any) => c.id === CHAIN_ID);
  if (official) return official;

  // Custom fallback
  return {
    id: CHAIN_ID,
    name: "GenLayer Testnet Bradbury",
    nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
    rpcUrls: { default: { http: ["/api/rpc"] } },
    blockExplorers: { default: { name: "GenLayer Explorer", url: EXPLORER } },
  };
};

/**
 * Returns a GenLayer client wired to window.ethereum (MetaMask).
 *
 * Always pass `walletAddress` for write ops — genlayer-js needs `account`
 * to be set or it throws "No account set". A plain address string routes
 * signing through window.ethereum automatically (no private key in frontend).
 *
 * `endpoint: "/api/rpc"` routes all JSON-RPC through the Express proxy
 * so browser CORS restrictions are bypassed.
 */
export const getClient = (walletAddress?: string | null) => {
  if (typeof window === "undefined" || !window.ethereum) return null;

  return createClient({
    chain: buildChain(),
    provider: window.ethereum,
    endpoint: "/api/rpc",
    ...(walletAddress ? { account: walletAddress as `0x${string}` } : {}),
  });
};
