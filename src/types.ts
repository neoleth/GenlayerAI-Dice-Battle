export type BattleStatus = "OPEN" | "RESOLVED";

export interface Battle {
  id: string;
  creator: string;
  wager: number;
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
}

export interface GameState {
  battles: Record<string, Battle>;
  leaderboard: Record<string, PlayerStats>;
}
