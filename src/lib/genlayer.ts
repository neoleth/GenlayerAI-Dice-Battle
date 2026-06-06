import { createClient, chains } from "genlayer-js";

/**
 * GenLayer Testnet Bradbury
 * Chain ID:  4221
 * RPC:       https://rpc-bradbury.genlayer.com  (proxied via /api/rpc)
 * Explorer:  https://zksync-os-testnet-genlayer.explorer.zksync.dev
 *
 * ROOT CAUSE FIX for "Unexpected token 'T', The page c... is not valid JSON":
 *
 * The error means viem received an HTML page instead of JSON from the RPC.
 * This happened because:
 *
 *   1. buildChain() was searching chains by ID (4221) and found `testnetAsimov`
 *      first (both Asimov and Bradbury share chain ID 4221 in genlayer-js).
 *
 *   2. `testnetAsimov` has its own hardcoded RPC URL (`rpc-asimov.genlayer.com`)
 *      INSIDE the chain object. genlayer-js uses this URL for the publicClient
 *      (read calls), bypassing the `endpoint` proxy.
 *
 *   3. At the same time, `endpoint: "/api/rpc"` was proxying write calls to
 *      `rpc-bradbury.genlayer.com` — a DIFFERENT network.
 *
 *   4. The Bradbury RPC is behind Cloudflare and blocks direct browser requests
 *      with a 403 HTML page ("The page cannot be displayed"), causing viem's
 *      JSON.parse to fail with the "Unexpected token T" error.
 *
 * FIX: Use `chains.testnetBradbury` explicitly instead of searching by ID.
 * Then override its rpcUrls to point to "/api/rpc" so ALL calls (both read
 * and write) go through the Express proxy, which forwards to the real RPC
 * server-side (no CORS/Cloudflare blocking).
 */

const FALLBACK_RPC = import.meta.env.VITE_GENLAYER_RPC || "https://zksync-os-testnet-genlayer.zksync.dev";

function getRpcUrl(): string {
  // Computed lazily at call-time, never at module load time.
  // window.location.origin is safe here because this is only called
  // after the browser has fully initialized.
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api/rpc`;
  }
  return FALLBACK_RPC;
}

function buildChain() {
  const rpcUrl = getRpcUrl();
  // Deep copy to prevent genlayer-js from mutating the shared chain object
  const chain = JSON.parse(JSON.stringify(chains.testnetBradbury));
  chain.rpcUrls = {
    default: { http: [rpcUrl] },
    public:  { http: [rpcUrl] },
  };
  return { chain, rpcUrl };
}

export const getClient = (walletAddress?: string | null) => {
  if (typeof window === "undefined" || !window.ethereum) return null;

  const { chain, rpcUrl } = buildChain();

  return createClient({
    chain,
    provider: window.ethereum,
    endpoint: rpcUrl,
    ...(walletAddress ? { account: walletAddress as `0x${string}` } : {}),
  });
};
