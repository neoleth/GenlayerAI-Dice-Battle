import React, { createContext, useContext, useState, useEffect } from "react";
import { Battle, GameState } from "../types";
import { getClient } from "../lib/genlayer";
import { getDiceBattleCode } from "../lib/contract";
import { BrowserProvider } from "ethers";
import { toast } from "react-toastify";

interface GameContextType {
  walletAddress: string | null;
  genBalance: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  gameState: GameState;
  createBattle: (wager: number) => Promise<string>;
  joinBattle: (battleId: string) => Promise<void>;
  resolveBattle: (battleId: string) => Promise<void>;
  getWinner: (battleId: string) => Promise<string | null>;
  isLoading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [genBalance, setGenBalance] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    battles: {},
    leaderboard: {},
  });
  const [isLoading, setIsLoading] = useState(false);
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "";

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setWalletAddress(accounts[0].address);
          }
        } catch (e) {
          console.error("Failed to check connection", e);
        }
      }
    };
    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(null);
        }
      });
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress) {
        setGenBalance(null);
        return;
      }
      try {
        const client = getClient();
        if (client) {
          const bal = await client.getBalance({ address: walletAddress as `0x${string}` });
          setGenBalance((Number(bal) / 1e18).toFixed(2));
        }
      } catch (e) {
        console.error("Failed to fetch GEN balance", e);
      }
    };
    fetchBalance();
  }, [walletAddress]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not found!");
      return;
    }
    
    // Prevent multiple connection requests triggering at once
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      toast.success("Wallet connected!");
    } catch (e: any) {
      // Check for user rejection or pending request
      if (e.code === 'ACTION_REJECTED' || e.info?.error?.code === 4001 || e.message?.includes('already pending') || e.code === -32002) {
        toast.info("Connection request pending! Please click the MetaMask extension icon in your browser toolbar to accept. Note: You may need to open this app in a new tab to connect.", { autoClose: 10000 });
      } else {
        toast.error(e?.message || "Failed to connect wallet");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => setWalletAddress(null);

  const createBattle = async (wager: number) => {
    if (!walletAddress) {
      await connectWallet();
      if (!walletAddress) throw new Error("Wallet not connected");
    }
    setIsLoading(true);
    
    try {
      const client = getClient();
      if (!client) throw new Error("GenLayer client not found");
      const code = await getDiceBattleCode();
      
      toast.info("Deploying new battle contract...");
      
      const txHash = await client.deployContract({
        code,
        args: [walletAddress],
      });
      
      const receipt = await client.waitForTransactionReceipt({ hash: txHash });
      const contractAddr = receipt.contractAddress;
      
      if (!contractAddr) throw new Error("Failed to get contract address");
      
      const id = contractAddr;
      const newBattle: Battle = {
        id,
        creator: walletAddress,
        wager,
        status: "OPEN",
        timestamp: Date.now(),
      };
      
      setGameState(prev => ({
        ...prev,
        battles: { ...prev.battles, [id]: newBattle }
      }));
      
      toast.success("Battle created on-chain!");
      return id;
    } catch (e: any) {
      toast.error(e?.message || "Failed to create battle");
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const joinBattle = async (battleId: string) => {
    if (!walletAddress) {
      await connectWallet();
    }
    if (!walletAddress) throw new Error("Wallet not connected");
    setIsLoading(true);
    
    try {
      const client = getClient();
      if (!client) throw new Error("GenLayer client not found");
      
      toast.info("Sending join_battle transaction...");
      await client.writeContract({
        address: battleId as `0x${string}`,
        functionName: "join_battle",
        args: [walletAddress],
        value: 0n,
      });
      toast.success("Transaction confirmed!");

      setGameState(prev => {
        const battle = prev.battles[battleId];
        if (!battle) return prev;
        return {
          ...prev,
          battles: {
            ...prev.battles,
            [battleId]: { ...battle, opponent: walletAddress }
          }
        };
      });
    } catch (e: any) {
      toast.error(e?.message || "Failed to join battle");
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const resolveBattle = async (battleId: string) => {
    if (!walletAddress) throw new Error("Wallet not connected");
    setIsLoading(true);
    
    try {
      const client = getClient();
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
      await client.writeContract({
        address: battleId as `0x${string}`,
        functionName: "resolve_battle",
        args: [BigInt(creatorRoll), BigInt(opponentRoll)],
        value: 0n,
      });
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
          body: JSON.stringify({
            winner: winnerName,
            loser: loserName,
            winnerRoll,
            loserRoll,
          }),
        });
        const storyData = await storyRes.json();
        if (storyData.story) {
           aiStory = storyData.story;
        }
      } catch (err) {
        console.error("Failed to generate AI story", err);
      }
      
      setGameState(prev => {
         return {
            ...prev,
            battles: {
              ...prev.battles,
              [battleId]: {
                 ...battle, 
                 status: "RESOLVED",
                 creatorRoll,
                 opponentRoll,
                 winner: winnerName,
                 story: aiStory,
              }
            }
         }
      });
    } catch (e: any) {
      toast.error(e?.message || "Failed to resolve battle");
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const getWinner = async (battleId: string): Promise<string | null> => {
     try {
        const client = getClient();
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

  return (
    <GameContext.Provider value={{ walletAddress, genBalance, connectWallet, disconnectWallet, gameState, createBattle, joinBattle, resolveBattle, getWinner, isLoading }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) throw new Error("useGame must be used within a GameProvider");
  return context;
};
