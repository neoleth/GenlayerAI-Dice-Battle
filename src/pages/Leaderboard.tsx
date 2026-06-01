import React from "react";
import { useGame } from "../context/GameContext";
import { shortenAddress } from "../lib/utils";
import { motion } from "motion/react";

export const Leaderboard = () => {
  const { gameState } = useGame();

  const sortedLeaderboard = (Object.values(gameState.leaderboard) as import("../types").PlayerStats[]).sort(
    (a, b) => b.wins - a.wins || b.totalBattles - a.totalBattles
  );

  return (
    <div className="flex-1 bg-[#0d0d11] p-4 md:p-12">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Stats */}
        <aside className="w-full md:w-1/3 border border-[#2a2a2e] bg-[#121216] p-6 rounded-lg self-start">
          <h2 className="text-xs uppercase tracking-[0.2em] text-[#6e6e76] font-bold mb-6">Global Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#16161c] p-4 rounded border border-[#2a2a2e]">
              <p className="text-[10px] text-[#6e6e76] uppercase tracking-widest mb-1">Total Fighters</p>
              <p className="text-xl font-bold font-mono text-white">{sortedLeaderboard.length}</p>
            </div>
            <div className="bg-[#16161c] p-4 rounded border border-[#2a2a2e]">
              <p className="text-[10px] text-[#6e6e76] uppercase tracking-widest mb-1">Total Battles</p>
              <p className="text-xl font-bold font-mono text-[#d4af37]">
                 {Math.floor(sortedLeaderboard.reduce((acc, p) => acc + p.totalBattles, 0) / 2) || 0}
              </p>
            </div>
          </div>
        </aside>

        {/* Right Column: Leaderboard Table */}
        <section className="flex-1">
          <div className="flex justify-between items-end mb-6 border-b border-[#2a2a2e] pb-4">
            <h2 className="text-xs uppercase tracking-[0.2em] text-[#6e6e76] font-bold">Hall of Legends</h2>
          </div>

          <div className="space-y-3">
            {sortedLeaderboard.map((player, index) => {
              const winRate = player.totalBattles > 0 
                ? Math.round((player.wins / player.totalBattles) * 100) 
                : 0;

              const isTop3 = index < 3;
              
              return (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={player.address} 
                  className={`bg-[#16161c] border p-4 rounded-lg flex items-center justify-between transition-all ${isTop3 ? 'border-[#d4af37]/30' : 'border-[#2a2a2e]'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded shrink-0 bg-[#1e1e24] flex items-center justify-center font-bold text-xs">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : <span className="text-[#6e6e76]">{index + 1}</span>}
                    </div>
                    <div>
                      <p className={`text-sm font-medium font-mono ${isTop3 ? 'text-white' : 'text-[#a0a0a5]'}`}>{shortenAddress(player.address)}</p>
                      <p className="text-[10px] text-[#6e6e76] uppercase tracking-widest mt-0.5">{player.totalBattles} Matches</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                     <div className="text-right">
                       <p className="text-[10px] text-[#6e6e76] uppercase tracking-widest mb-0.5">Wins</p>
                       <p className={`text-sm font-bold ${isTop3 ? 'text-[#d4af37]' : 'text-white'}`}>{player.wins}</p>
                     </div>
                     <div className="text-right w-16">
                       <p className="text-[10px] text-[#6e6e76] uppercase tracking-widest mb-0.5">Rate</p>
                       <p className="text-sm font-mono text-[#a0a0a5]">{winRate}%</p>
                     </div>
                  </div>
                </motion.div>
              );
            })}

            {sortedLeaderboard.length === 0 && (
              <div className="text-center py-16 text-[#6e6e76] text-sm uppercase tracking-widest">
                No warriors recorded yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
