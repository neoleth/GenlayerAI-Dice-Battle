import React, { createContext, useContext, useState, useEffect } from "react";
import { Battle, GameState, PlayerStats } from "../types";

interface GameContextType {
  walletAddress: string | null;
  connectWallet: () => void;
  disconnectWallet: () => void;
  gameState: GameState;
  createBattle: (wager: number) => Promise<string>;
  joinBattle: (battleId: string) => Promise<void>;
  isLoading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Simulated initial leaderboard to show some UI
const INITIAL_LEADERBOARD = {
  "0x1234567890abcdef1234567890abcdef12345678": { address: "0x1234567890abcdef1234567890abcdef12345678", wins: 12, totalBattles: 15 },
  "0xabcdef1234567890abcdef1234567890abcdef12": { address: "0xabcdef1234567890abcdef1234567890abcdef12", wins: 8, totalBattles: 10 },
};

// Single dummy battle to show in lobby
const INITIAL_BATTLES = {
  "b-100": {
    id: "b-100",
    creator: "0xabcdef1234567890abcdef1234567890abcdef12",
    wager: 100,
    status: "OPEN" as const,
    timestamp: Date.now(),
  }
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    battles: INITIAL_BATTLES,
    leaderboard: INITIAL_LEADERBOARD,
  });
  const [isLoading, setIsLoading] = useState(false);

  const connectWallet = () => {
    // Mock connecting wallet
    const mockAddress = "0x" + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
    setWalletAddress(mockAddress);
    
    // Add to leaderboard if not exists
    setGameState(prev => {
      if (!prev.leaderboard[mockAddress]) {
        return {
          ...prev,
          leaderboard: {
            ...prev.leaderboard,
            [mockAddress]: { address: mockAddress, wins: 0, totalBattles: 0 }
          }
        };
      }
      return prev;
    });
  };

  const disconnectWallet = () => setWalletAddress(null);

  const createBattle = async (wager: number) => {
    if (!walletAddress) throw new Error("Wallet not connected");
    setIsLoading(true);
    
    // Simulate GenLayer transaction delay
    await new Promise(r => setTimeout(r, 1000));
    
    const id = "b-" + Math.floor(Math.random() * 1000000);
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
    
    setIsLoading(false);
    return id;
  };

  const joinBattle = async (battleId: string) => {
    if (!walletAddress) throw new Error("Wallet not connected");
    setIsLoading(true);
    
    const battle = gameState.battles[battleId];
    if (!battle || battle.status !== "OPEN") {
      setIsLoading(false);
      throw new Error("Battle not available");
    }

    // Simulate GenLayer resolving transaction
    let creatorRoll = Math.floor(Math.random() * 6) + 1;
    let opponentRoll = Math.floor(Math.random() * 6) + 1;
    
    while (creatorRoll === opponentRoll) {
      creatorRoll = Math.floor(Math.random() * 6) + 1;
      opponentRoll = Math.floor(Math.random() * 6) + 1;
    }
    
    const winner = creatorRoll > opponentRoll ? battle.creator : walletAddress;
    const loser = creatorRoll > opponentRoll ? walletAddress : battle.creator;
    const winnerRoll = Math.max(creatorRoll, opponentRoll);
    const loserRoll = Math.min(creatorRoll, opponentRoll);

    let story = "";
    try {
      // Call backend API to use Gemini for story generation
      const res = await fetch("/api/generate_story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner, loser, winnerRoll, loserRoll })
      });
      const data = await res.json();
      if (data.story) {
        story = data.story;
      }
    } catch (e) {
      console.error(e);
      story = `${winner} rolled a ${winnerRoll} against ${loserRoll}. A decisive elemental strike secured the victory!`;
    }

    const resolvedBattle: Battle = {
      ...battle,
      status: "RESOLVED",
      opponent: walletAddress,
      creatorRoll,
      opponentRoll,
      winner,
      story,
    };
    
    setGameState(prev => {
      const nextBoard = { ...prev.leaderboard };
      if (!nextBoard[winner]) nextBoard[winner] = { address: winner, wins: 0, totalBattles: 0 };
      if (!nextBoard[loser]) nextBoard[loser] = { address: loser, wins: 0, totalBattles: 0 };
      
      nextBoard[winner].wins += 1;
      nextBoard[winner].totalBattles += 1;
      nextBoard[loser].totalBattles += 1;
      
      return {
        ...prev,
        battles: { ...prev.battles, [battleId]: resolvedBattle },
        leaderboard: nextBoard,
      };
    });
    
    setIsLoading(false);
  };

  return (
    <GameContext.Provider value={{ walletAddress, connectWallet, disconnectWallet, gameState, createBattle, joinBattle, isLoading }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) throw new Error("useGame must be used within a GameProvider");
  return context;
};
