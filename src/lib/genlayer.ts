import { createClient, chains } from "genlayer-js";

// Use the official GenLayer testnet chain config if matching,
// otherwise build a custom chain from env vars.
const getRpcUrl = () =>
  import.meta.env.VITE_GENLAYER_RPC || "https://zksync-os-testnet-genlayer.zksync.dev";

const getChainId = () =>
  Number(import.meta.env.VITE_CHAIN_ID || 61999);

// Build a chain that matches the testnet structure
// (consensusMainContract is required by _sendTransaction)
const buildChain = (): any => {
  const rpc = getRpcUrl();
  const id = getChainId();

  // Prefer the official chain objects so consensusMainContract is correct
  const officialChain = Object.values(chains).find((c: any) => c.id === id);
  if (officialChain) return officialChain as any;

  // Fallback custom chain — consensusMainContract must be set for writes to work
  const customChain: any = {
    id,
    name: "GenLayer Custom",
    nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
    rpcUrls: { default: { http: [rpc] } },
    // NOTE: If using a custom RPC you must also provide consensusMainContract
    // consensusMainContract: { address: "0x..." },
  };

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
    endpoint: getRpcUrl(), // Use direct RPC URL since it supports CORS
    // Pass the connected address so validateAccount() doesn't throw.
    // genlayer-js treats a plain string address as "use provider for signing".
    ...(walletAddress ? { account: walletAddress as `0x${string}` } : {}),
  });
};
