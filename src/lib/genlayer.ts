import { createClient, chains } from "genlayer-js";

/**
 * GenLayer Testnet Bradbury
 * Chain ID:  4221
 * RPC:       https://rpc-bradbury.genlayer.com  (proxied via /api/rpc)
 * Explorer:  https://explorer-bradbury.genlayer.com
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

const BRADBURY_CHAIN = {
  ...chains.testnetBradbury,
  rpcUrls: {
    default: { http: ["/api/rpc"] },
    public:  { http: ["/api/rpc"] },
  },
};

export const getClient = (walletAddress?: string | null) => {
  if (typeof window === "undefined" || !window.ethereum) return null;

  return createClient({
    chain: BRADBURY_CHAIN,
    provider: window.ethereum,
    endpoint: "/api/rpc",
    ...(walletAddress ? { account: walletAddress as `0x${string}` } : {}),
  });
};
