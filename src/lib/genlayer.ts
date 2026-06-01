import { createClient, chains } from "genlayer-js";
import type { GenLayerChain } from "genlayer-js";

// Use the official GenLayer testnet chain config if matching,
// otherwise build a custom chain from env vars.
const getRpcUrl = () =>
  import.meta.env.VITE_GENLAYER_RPC || "https://studio.genlayer.com/api";

const getChainId = () =>
  Number(import.meta.env.VITE_CHAIN_ID || 61999);

// Build a GenLayerChain that matches the testnet structure
// (consensusMainContract is required by _sendTransaction)
const buildChain = (): GenLayerChain => {
  const rpc = getRpcUrl();
  const id = getChainId();

  // Prefer the official chain objects so consensusMainContract is correct
  const officialChain = Object.values(chains).find((c: any) => c.id === id);
  if (officialChain) return officialChain as GenLayerChain;

  // Fallback custom chain — consensusMainContract must be set for writes to work
  const customChain: GenLayerChain = {
    id,
    name: "GenLayer Custom",
    nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
    rpcUrls: { default: { http: [rpc] } },
    // NOTE: If using a custom RPC you must also provide consensusMainContract
    // consensusMainContract: { address: "0x..." },
  } as GenLayerChain;

  return customChain;
};

/**
 * Returns a GenLayer client wired to window.ethereum.
 *
 * KEY FIX: genlayer-js requires `account` to be set on the client
 * (or passed per-call) for any write operation. When using an
 * EIP-1193 provider (MetaMask), pass the connected wallet address
 * as `account`. The library detects that it is a plain address string
 * (not a local private-key account) and routes signing through the
 * provider automatically.
 */
export const getClient = (walletAddress?: string | null) => {
  if (typeof window === "undefined" || !window.ethereum) return null;

  return createClient({
    chain: buildChain(),
    provider: window.ethereum,
    // Pass the connected address so validateAccount() doesn't throw.
    // genlayer-js treats a plain string address as "use provider for signing".
    ...(walletAddress ? { account: walletAddress as `0x${string}` } : {}),
  });
};
