import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { shortenAddress } from "../lib/utils";
import { Dice } from "../components/Dice";
import { motion, AnimatePresence } from "motion/react";
import { Trophy } from "lucide-react";

export const Battle = () => {
  const { id } = useParams<{ id: string }>();
  const { gameState, walletAddress, joinBattle, resolveBattle, isLoading } = useGame();
  const navigate = useNavigate();
  
  const [showingStory, setShowingStory] = useState(false);

  const battle = id ? gameState.battles[id] : null;

  useEffect(() => {
    if (battle?.status === "RESOLVED") {
      const timer = setTimeout(() => setShowingStory(true), 2500); // Wait for dice animation
      return () => clearTimeout(timer);
    }
  }, [battle?.status]);

  if (!battle) {
    return (
      <div className="flex-1 bg-gradient-to-b from-[#121216] to-[#0a0a0c] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-[#2a2a2e] border-t-[#d4af37] rounded-full animate-spin mx-auto" />
          <h2 className="text-xs uppercase tracking-[0.2em] text-[#6e6e76] font-bold mt-4">Consulting intelligent contract...</h2>
        </div>
      </div>
    );
  }

  const isCreator = battle.creator === walletAddress;

  const handleJoin = async () => {
    if (!id) return;
    try {
      if (battle?.status === "OPEN" && !battle.opponent) {
        await joinBattle(id);
      }
      await resolveBattle(id);
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#121216] to-[#0a0a0c] p-6 lg:p-10 relative">
      
      {/* HUD */}
      <div className="absolute top-8 w-full px-8 flex justify-between items-center z-10 max-w-6xl">
        <div className="bg-[#16161c] border border-[#2a2a2e] px-4 py-2 rounded flex gap-3 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
          <span className="text-[#6e6e76] text-[10px] uppercase tracking-widest pt-0.5">Match ID</span>
          <span className="text-[#d4af37] font-mono text-sm">{id || "0000"}</span>
        </div>
        <div className="bg-[#16161c] border border-[#d4af37]/30 px-4 py-2 rounded flex gap-3 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
          <span className="text-[#6e6e76] text-[10px] uppercase tracking-widest pt-0.5">Stake</span>
          <span className="text-[#f0e6d2] font-bold text-sm font-mono">{battle.wager} GEN</span>
        </div>
      </div>

      {/* Arena Stage */}
      <div className="w-full max-w-4xl flex flex-col items-center mt-16 md:mt-0">
        <div className="flex w-full items-center justify-center gap-8 md:gap-20 mb-12">
          
          {/* Player 1 (Creator) */}
          <div className="text-center">
            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full border-2 border-[#d4af37] p-1 mb-3">
              <div className="w-full h-full bg-[#1e1e24] rounded-full flex items-center justify-center text-3xl md:text-4xl shadow-[0_0_20px_rgba(212,175,55,0.2)]">🧙</div>
            </div>
            <p className="font-serif text-lg text-white mb-1">Challenger</p>
            <p className="text-xs text-[#d4af37] font-mono tracking-tighter">{shortenAddress(battle.creator)}</p>
          </div>
          
          {/* VS Divider */}
          <div className="text-4xl md:text-5xl font-serif italic text-[#6e6e76]">VS</div>

          {/* Player 2 (Opponent) */}
          <div className="text-center">
            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full border-2 border-[#8b0000] p-1 mb-3">
              <div className="w-full h-full bg-[#1e1e24] rounded-full flex items-center justify-center text-3xl md:text-4xl shadow-[0_0_20px_rgba(139,0,0,0.2)]">🗡️</div>
            </div>
            <p className="font-serif text-lg text-white mb-1">Opponent</p>
            {battle.opponent ? (
               <p className="text-xs text-[#8b0000] font-mono tracking-tighter">{shortenAddress(battle.opponent)}</p>
            ) : (
              <p className="text-xs text-[#6e6e76] font-mono tracking-widest uppercase animate-pulse">Waiting...</p>
            )}
          </div>
        </div>

        {/* Dice Area */}
        <div className="flex gap-8 md:gap-16 justify-center items-center h-40">
           <Dice 
              value={battle.creatorRoll || 1} 
              isRolling={isLoading} 
              color="gold"
              size="lg"
            />

            {battle.status === "OPEN" ? (
              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-[#2a2a2e] flex flex-col items-center justify-center bg-[#16161c]">
                 {!isCreator && walletAddress && (
                   <button 
                     onClick={handleJoin}
                     disabled={isLoading}
                     className="bg-[#2a2a2e] hover:bg-[#8b0000] hover:text-white text-[#a0a0a5] text-xs font-bold py-2 px-4 rounded uppercase tracking-widest transition-all"
                   >
                     {isLoading ? "Rolling..." : "Join"}
                   </button>
                 )}
                 {!walletAddress && <span className="text-[10px] uppercase text-[#6e6e76] tracking-widest text-center px-4">Connect to join</span>}
                 {isCreator && <span className="text-[10px] uppercase text-[#6e6e76] tracking-widest text-center px-4">Awaiting opponent</span>}
              </div>
            ) : (
              <Dice 
                value={battle.opponentRoll || 1} 
                isRolling={isLoading} 
                color="red"
                size="lg"
              />
            )}
        </div>
      </div>

      {/* Result & Story Narration */}
      <AnimatePresence>
        {battle.status === "RESOLVED" && showingStory && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg bg-[#16161c] border border-[#2a2a2e] rounded-xl p-6 relative overflow-hidden mt-12 shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#d4af37]" />
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-[#d4af37] text-[10px] uppercase tracking-widest font-bold">AI Battle Narration</h3>
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-[#d4af37]" />
                <span className="text-xs font-mono text-white">Winner: {shortenAddress(battle.winner || "")}</span>
              </div>
            </div>
            
            {battle.story ? (
              <p className="font-serif italic text-lg leading-relaxed text-[#f0e6d2]">
                "{battle.story}"
              </p>
            ) : (
              <p className="text-[#6e6e76] text-sm animate-pulse">Intelligent contract generating narrative...</p>
            )}

            <div className="mt-8 pt-4 border-t border-[#2a2a2e] text-center">
              <button 
                onClick={() => navigate("/lobby")}
                className="text-[10px] uppercase tracking-widest text-[#a0a0a5] hover:text-[#d4af37] transition-all"
              >
                Return to Lobby
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
