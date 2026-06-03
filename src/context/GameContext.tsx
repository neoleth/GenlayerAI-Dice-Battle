import React, { createContext, useContext, useState, useEffect } from "react";
import { Battle, GameState } from "../types";
import { getClient } from "../lib/genlayer";
import { getDiceBattleCode } from "../lib/contract";
import { BrowserProvider, parseEther, formatEther } from "ethers";
import { toast } from "react-toastify";

// ─── Bradbury Testnet Config (from docs.genlayer.com/developers/networks) ───
const BRADBURY_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 4221);
const BRADBURY_RPC      = import.meta.env.VITE_GENLAYER_RPC || "https://rpc-bradbury.genlayer.com";
const BRADBURY_EXPLORER = import.meta.env.VITE_EXPLORER || "https://explorer-bradbury.genlayer.com";

const BRADBURY_NETWORK_PARAMS = {
  chainId: `0x${BRADBURY_CHAIN_ID.toString(16)}`,
  chainName: "GenLayer Testnet Bradbury",
  rpcUrls: [BRADBURY_RPC],
  nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
  blockExplorerUrls: [BRADBURY_EXPLORER],
};

interface GameContextType {
  walletAddress: string | null;
  genBalance: string | null;
  networkName: string | null;
  txStatus: "idle" | "pending" | "confirming" | "success" | "error";
  txHash: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  gameState: GameState;
  createBattle: (wager: number) => Promise<string>;
  joinBattle: (battleId: string) => Promise<void>;
  resolveBattle: (battleId: string) => Promise<void>;
  getWinner: (battleId: string) => Promise<string | null>;
  isLoading: boolean;
  isCorrectNetwork: boolean;
  switchNetwork: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [genBalance, setGenBalance] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(true);
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "confirming" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>({ battles: {}, leaderboard: {} });
  const [isLoading, setIsLoading] = useState(false);

  // ── Auto-connect on load ──────────────────────────────────────────────────
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) setWalletAddress(accounts[0].address);
        } catch (e) {
          console.error("Failed to check connection", e);
        }
      }
    };
    checkConnection();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setWalletAddress(accounts.length > 0 ? accounts[0] : null);
      });
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  // ── Fetch GEN balance ─────────────────────────────────────────────────────
  // ROOT CAUSE FIX: The old code checked `currentChainId === expectedChainId`
  // and immediately returned "0.00" if the network didn't match.
  // This caused the balance to always show 0 when MetaMask was connected to
  // any network other than exactly chain ID 4221 — even if the user had GEN tokens.
  //
  // NEW APPROACH:
  // 1. Always try to fetch the balance via the GenLayer RPC directly (not MetaMask provider).
  //    This bypasses the MetaMask network check entirely.
  // 2. If that fails, fall back to MetaMask provider.getBalance().
  // 3. Show network warning separately without zeroing out the balance.
  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress) {
        setGenBalance(null);
        setNetworkName(null);
        return;
      }

      try {
        // Detect MetaMask's current network for the warning badge
        const mmProvider = new BrowserProvider(window.ethereum);
        const network = await mmProvider.getNetwork();
        const currentChainId = Number(network.chainId);
        const onCorrectNetwork = currentChainId === BRADBURY_CHAIN_ID;
        setIsCorrectNetwork(onCorrectNetwork);
        setNetworkName(onCorrectNetwork ? "GenLayer Bradbury" : `Wrong Network (${currentChainId})`);

        // ALWAYS fetch balance from the Bradbury RPC directly via eth_getBalance JSON-RPC.
        // This works regardless of what MetaMask is currently connected to.
        // The /api/rpc proxy forwards to VITE_GENLAYER_RPC on the server.
        const rpcBody = {
          jsonrpc: "2.0",
          method: "eth_getBalance",
          params: [walletAddress, "latest"],
          id: 1,
        };

        const response = await fetch("/api/rpc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rpcBody),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            // result is hex wei string e.g. "0x8ac7230489e80000"
            const balanceWei = BigInt(data.result);
            const formatted = parseFloat(formatEther(balanceWei)).toFixed(4);
            setGenBalance(formatted);
            return;
          }
        }

        // Fallback: use MetaMask provider only if on correct network
        if (onCorrectNetwork) {
          const bal = await mmProvider.getBalance(walletAddress);
          setGenBalance(parseFloat(formatEther(bal)).toFixed(4));
        } else {
          // We're on wrong network and direct RPC also failed — show unknown
          setGenBalance("—");
        }
      } catch (e) {
        console.error("Failed to fetch GEN balance:", e);
        setGenBalance("—");
      }
    };

    fetchBalance();
  }, [walletAddress]);

  // ── Switch / Add network ──────────────────────────────────────────────────
  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      // First, try adding the network. Why? Because the user's Metamask might have the 
      // network added with rpc-bradbury.genlayer.com, which is getting blocked by Cloudflare!
      // Calling wallet_addEthereumChain with an existing chainId prompts the user to UPDATE the RPC URL 
      // to our local proxy, bypassing Cloudflare.
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [BRADBURY_NETWORK_PARAMS],
      });
    } catch (err: any) {
      if (err.code === 4001) return; // User rejected request
      // If add fails (e.g. they already have it exactly as configured), we switch
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BRADBURY_NETWORK_PARAMS.chainId }],
        });
      } catch (switchError: any) {
        toast.error("Failed to switch network.");
      }
    }
  };

  // ── Connect wallet ────────────────────────────────────────────────────────
  const connectWallet = async () => {
    if (!window.ethereum) { toast.error("MetaMask not found!"); return; }
    if (isLoading) return;
    try {
      setIsLoading(true);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      toast.success("Wallet connected!");
    } catch (e: any) {
      const isPending = e.code === -32002 || e.message?.includes("already pending");
      const isRejected = e.code === "ACTION_REJECTED" || e.info?.error?.code === 4001;
      if (isPending || isRejected) {
        toast.info("Connection request pending — open MetaMask and approve.", { autoClose: 10000 });
      } else {
        toast.error(e?.message || "Failed to connect wallet");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setGenBalance(null);
    setNetworkName(null);
  };

  // ── Create Battle ─────────────────────────────────────────────────────────
  const createBattle = async (wager: number): Promise<string> => {
    if (!walletAddress) {
      await connectWallet();
      if (!walletAddress) throw new Error("Wallet not connected");
    }
    setIsLoading(true);
    setTxStatus("pending");
    setTxHash(null);
    try {
      const client = getClient(walletAddress);
      if (!client) throw new Error("GenLayer client not found");
      const code = await getDiceBattleCode();

      toast.info("Deploying new battle contract...");
      const txHashStr = await client.deployContract({
        code,
        args: [walletAddress, BigInt(wager)],
      });
      setTxHash(txHashStr);
      setTxStatus("confirming");

      const receipt = await client.waitForTransactionReceipt({ hash: txHashStr as any });
      const contractAddr = (receipt as any).contractAddress || (receipt as any).contract_address;
      if (!contractAddr) throw new Error("Failed to get contract address from receipt");

      const newBattle: Battle = {
        id: contractAddr,
        creator: walletAddress,
        wager,
        status: "OPEN",
        timestamp: Date.now(),
      };
      setGameState(prev => ({ ...prev, battles: { ...prev.battles, [contractAddr]: newBattle } }));
      setTxStatus("success");
      toast.success("Battle created on-chain!");

      // Refresh balance after tx
      refreshBalance(walletAddress);
      return contractAddr;
    } catch (e: any) {
      setTxStatus("error");
      toast.error(e?.message || "Failed to create battle");
      throw e;
    } finally {
      setIsLoading(false);
      setTimeout(() => setTxStatus("idle"), 5000);
    }
  };

  // ── Join Battle ───────────────────────────────────────────────────────────
  const joinBattle = async (battleId: string) => {
    if (!walletAddress) { await connectWallet(); }
    if (!walletAddress) throw new Error("Wallet not connected");
    setIsLoading(true);
    setTxStatus("pending");
    setTxHash(null);
    try {
      const client = getClient(walletAddress);
      if (!client) throw new Error("GenLayer client not found");

      const battle = gameState.battles[battleId];
      if (!battle) throw new Error("Battle not found");

      toast.info("Sending join_battle transaction...");
      const wagerValue = parseEther(battle.wager.toString());

      const txHashStr = await client.writeContract({
        address: battleId as `0x${string}`,
        functionName: "join_battle",
        args: [walletAddress],
        value: wagerValue,
      });
      setTxHash(txHashStr);
      setTxStatus("confirming");
      await client.waitForTransactionReceipt({ hash: txHashStr });
      setTxStatus("success");
      toast.success("Transaction confirmed!");

      setGameState(prev => {
        const b = prev.battles[battleId];
        if (!b) return prev;
        return { ...prev, battles: { ...prev.battles, [battleId]: { ...b, opponent: walletAddress } } };
      });
      refreshBalance(walletAddress);
    } catch (e: any) {
      setTxStatus("error");
      toast.error(e?.message || "Failed to join battle");
      throw e;
    } finally {
      setIsLoading(false);
      setTimeout(() => setTxStatus("idle"), 5000);
    }
  };

  // ── Resolve Battle ────────────────────────────────────────────────────────
  const resolveBattle = async (battleId: string) => {
    if (!walletAddress) throw new Error("Wallet not connected");
    setIsLoading(true);
    setTxStatus("pending");
    setTxHash(null);
    try {
      const client = getClient(walletAddress);
      if (!client) throw new Error("GenLayer client not found");

      let creatorRoll = Math.floor(Math.random() * 6) + 1;
      let opponentRoll = Math.floor(Math.random() * 6) + 1;
      while (creatorRoll === opponentRoll) {
        creatorRoll = Math.floor(Math.random() * 6) + 1;
        opponentRoll = Math.floor(Math.random() * 6) + 1;
      }

      const battle = gameState.battles[battleId];
      if (!battle) throw new Error("Battle not found");

      toast.info("Sending resolve_battle transaction...");
      const txHashStr = await client.writeContract({
        address: battleId as `0x${string}`,
        functionName: "resolve_battle",
        args: [BigInt(creatorRoll), BigInt(opponentRoll)],
        value: 0n,
      });
      setTxHash(txHashStr);
      setTxStatus("confirming");
      await client.waitForTransactionReceipt({ hash: txHashStr });
      setTxStatus("success");
      toast.success("Winner determined on-chain!");

      let winnerName = await getWinner(battleId);
      if (!winnerName) winnerName = battle.creator;

      const loserName = winnerName === battle.creator ? battle.opponent : battle.creator;
      const winnerRoll = creatorRoll > opponentRoll ? creatorRoll : opponentRoll;
      const loserRoll = creatorRoll > opponentRoll ? opponentRoll : creatorRoll;

      let aiStory = "The forces clashed, leading to an elemental victory!";
      try {
        const storyRes = await fetch("/api/generate_story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ winner: winnerName, loser: loserName, winnerRoll, loserRoll, wager: battle.wager }),
        });
        const storyData = await storyRes.json();
        if (storyData.story) aiStory = storyData.story;
      } catch (err) {
        console.error("Failed to generate AI story", err);
      }

      setGameState(prev => {
        const newLeaderboard = { ...prev.leaderboard };
        const initStats = (addr: string) => {
          if (!newLeaderboard[addr]) {
            newLeaderboard[addr] = { address: addr, wins: 0, totalBattles: 0, totalGenWon: 0, largestVictory: 0 } as any;
          }
        };
        initStats(battle.creator);
        if (battle.opponent) initStats(battle.opponent);
        newLeaderboard[battle.creator].totalBattles += 1;
        if (battle.opponent) newLeaderboard[battle.opponent].totalBattles += 1;
        if (winnerName && winnerName !== "DRAW") {
          const reward = battle.wager * 2;
          newLeaderboard[winnerName].wins += 1;
          (newLeaderboard[winnerName] as any).totalGenWon += reward;
          if (reward > (newLeaderboard[winnerName] as any).largestVictory) {
            (newLeaderboard[winnerName] as any).largestVictory = reward;
          }
        }
        return {
          ...prev,
          leaderboard: newLeaderboard,
          battles: {
            ...prev.battles,
            [battleId]: { ...battle, status: "RESOLVED", creatorRoll, opponentRoll, winner: winnerName, story: aiStory },
          },
        };
      });

      refreshBalance(walletAddress);
    } catch (e: any) {
      setTxStatus("error");
      toast.error(e?.message || "Failed to resolve battle");
      throw e;
    } finally {
      setIsLoading(false);
      setTimeout(() => setTxStatus("idle"), 5000);
    }
  };

  // ── Get Winner ────────────────────────────────────────────────────────────
  const getWinner = async (battleId: string): Promise<string | null> => {
    try {
      const client = getClient(walletAddress);
      if (!client) return null;
      const winner = await client.readContract({
        address: battleId as `0x${string}`,
        functionName: "get_winner",
        args: [],
      });
      return String(winner) || null;
    } catch (e) {
      console.error("Failed to fetch winner on-chain", e);
      return null;
    }
  };

  // ── Refresh balance helper (called after txs) ─────────────────────────────
  const refreshBalance = async (address: string) => {
    try {
      const response = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getBalance", params: [address, "latest"], id: 1 }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          const formatted = parseFloat(formatEther(BigInt(data.result))).toFixed(4);
          setGenBalance(formatted);
        }
      }
    } catch (e) {
      console.error("Balance refresh failed", e);
    }
  };

  return (
    <GameContext.Provider value={{
      walletAddress, genBalance, networkName, txStatus, txHash,
      connectWallet, disconnectWallet, gameState,
      createBattle, joinBattle, resolveBattle, getWinner,
      isLoading, isCorrectNetwork, switchNetwork,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) throw new Error("useGame must be used within a GameProvider");
  return context;
};
