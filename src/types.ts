export type BattleStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export interface Battle {
  id: string;
  creator: string;
  wager: string;
  status: BattleStatus;
  opponent?: string;
  creatorRoll?: number;
  opponentRoll?: number;
  winner?: string;
  story?: string;
  timestamp: number;
}

export interface PlayerStats {
  address: string;
  wins: number;
  totalBattles: number;
  totalGenWon: number;
  largestVictory: number;
}

export interface GameState {
  battles: Record<string, Battle>;
  leaderboard: Record<string, PlayerStats>;
}
