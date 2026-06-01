import React from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { motion } from "motion/react";
import { Clock } from "lucide-react";
import { shortenAddress } from "../lib/utils";

export const Lobby = () => {
  const { gameState } = useGame();
  const navigate = useNavigate();

  const openBattles = (Object.values(gameState.battles) as import("../types").Battle[])
    .filter((b) => b.status === "OPEN")
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="flex-1 bg-[#0d0d11] p-4 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-8 border-b border-[#2a2a2e] pb-4">
          <h2 className="text-xs uppercase tracking-[0.2em] text-[#6e6e76] font-bold">Open Battles</h2>
          <span className="text-[10px] text-[#d4af37] border border-[#d4af37]/20 px-2 py-0.5 rounded font-mono">{openBattles.length} Waiting</span>
        </div>

        {openBattles.length === 0 ? (
          <div className="text-center py-24 border border-[#2a2a2e] bg-[#16161c] rounded-lg">
            <Clock className="w-12 h-12 text-[#6e6e76] mx-auto mb-4 opacity-50" />
            <h3 className="text-sm font-medium text-[#a0a0a5] uppercase tracking-widest">No open arenas</h3>
            <p className="text-[#6e6e76] mt-2 text-xs">Create a new battle from the home page to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {openBattles.map((battle, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={battle.id}
                onClick={() => navigate(`/battle/${battle.id}`)}
                className="bg-[#16161c] border border-[#2a2a2e] p-6 rounded-lg hover:border-[#d4af37]/50 cursor-pointer transition-all group flex flex-col"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium font-mono text-[#e0e0e0] group-hover:text-white transition-colors">{shortenAddress(battle.creator)}</span>
                  <span className="text-[#d4af37] text-sm font-bold font-mono">{battle.wager} GEN</span>
                </div>
                <div className="text-[10px] text-[#6e6e76] flex justify-between items-center mt-auto pt-4 border-t border-[#2a2a2e]/50">
                  <span className="uppercase tracking-widest">{new Date(battle.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <span className="bg-[#2a2a2e] group-hover:bg-[#d4af37] group-hover:text-black transition-colors px-3 py-1 rounded text-[#e0e0e0] uppercase tracking-widest font-bold">JOIN</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
