import React, { createContext, useContext, useState, useEffect } from "react";
import { Battle, GameState } from "../types";
import { getClient } from "../lib/genlayer";
import { BrowserProvider } from "ethers";
import { toast } from "react-toastify";

interface GameContextType {
  walletAddress: string | null;
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
      if (e.code === 'ACTION_REJECTED' || e.info?.error?.code === 4001 || e.message?.includes('already pending')) {
        toast.info("Please open MetaMask and accept the connection request.");
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
      // In this demo, since we use a single static contract from ENV, 
      // we'll pretend we are creating a battle returning the contract address.
      // If we wanted to deploy a new one, we would use client.deployContract()
      
      const id = contractAddress || "local-battle-id";
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
      
      toast.success("Battle created on-chain (simulated for singleton)!");
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
      
      if (contractAddress) {
        toast.info("Sending join_battle transaction...");
        await client.writeContract({
          address: contractAddress as `0x${string}`,
          functionName: "join_battle",
          args: [walletAddress],
          value: 0n,
        });
        toast.success("Transaction confirmed!");
      }

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

      if (contractAddress) {
        toast.info("Sending resolve_battle transaction...");
        await client.writeContract({
          address: contractAddress as `0x${string}`,
          functionName: "resolve_battle",
          args: [BigInt(creatorRoll), BigInt(opponentRoll)],
          value: 0n,
        });
        toast.success("Winner determined on-chain!");
      }
      
      const winnerName = await getWinner(battleId);
      
      const battle = gameState.battles[battleId];
      if (battle) {
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
                    winner: winnerName || battle.creator,
                    story: "The AI judges decree: The rolled forces clashed, leading to an elemental victory!"
                 }
               }
            }
         });
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to resolve battle");
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const getWinner = async (battleId: string): Promise<string | null> => {
     if (!contractAddress) return null;
     try {
        const client = getClient();
        if (!client) return null;
        const winner = await client.readContract({
           address: contractAddress as `0x${string}`,
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
    <GameContext.Provider value={{ walletAddress, connectWallet, disconnectWallet, gameState, createBattle, joinBattle, resolveBattle, getWinner, isLoading }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) throw new Error("useGame must be used within a GameProvider");
  return context;
};
