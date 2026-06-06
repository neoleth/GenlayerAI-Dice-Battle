import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { motion } from "motion/react";
import { Dices, Swords } from "lucide-react";
import { Dice } from "../components/Dice";

export const Home = () => {
  const { walletAddress, createBattle, isLoading } = useGame();
  const [wager, setWager] = useState("10");
  const navigate = useNavigate();

  const handleCreate = async () => {
    try {
      const id = await createBattle(wager);
      navigate(`/battle/${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-[#121216] to-[#0a0a0c] flex flex-col justify-center px-4 py-12 md:py-24">
      <div className="max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8"
        >
          <div className="flex justify-center mb-8 gap-6">
             <Dice value={6} isRolling={false} color="gold" size="md" />
             <Dice value={4} isRolling={false} color="red" size="md" />
          </div>

          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-[#f0e6d2]">
            <span className="block mb-2">AI Dice Battle</span>
            <span className="text-[#d4af37] text-3xl md:text-5xl border-t border-[#d4af37]/30 pt-4 block mt-4 mx-auto max-w-sm">
              Powered by GenLayer
            </span>
          </h1>
          
          <p className="text-lg text-[#a0a0a5] max-w-2xl mx-auto leading-relaxed">
            Step into the on-chain arena. Wager tokens, roll the dice, and let Intelligent Contracts adjudicate the winner while generating epic fantasy narratives for every battle.
          </p>

          {!walletAddress ? (
            <div className="mt-12 p-8 border border-[#2a2a2e] bg-[#16161c] rounded-xl max-w-md mx-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#d4af37]"></div>
              <Swords className="w-12 h-12 text-[#6e6e76] mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-[#e0e0e0]">Connect to Play</h3>
              <p className="text-sm text-[#6e6e76]">Connect your wallet to enter the arena and challenge other players.</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-12 p-8 border border-[#2a2a2e] bg-[#16161c] rounded-xl max-w-sm mx-auto relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-[#d4af37]"></div>
              <h3 className="text-sm font-bold mb-6 uppercase tracking-widest text-[#d4af37]">Create Battle</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-medium text-[#6e6e76] mb-2 uppercase tracking-widest text-left">
                    Wager Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={wager}
                      onChange={(e) => setWager(e.target.value)}
                      min="1"
                      step="0.01"
                      className="w-full bg-[#0d0d11] border border-[#2a2a2e] rounded px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] focus:shadow-[0_0_10px_rgba(212,175,55,0.1)] transition-all font-mono"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#d4af37] font-bold text-xs uppercase tracking-widest">
                      GEN
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={isLoading}
                  className="w-full bg-[#d4af37] text-black font-bold py-4 rounded uppercase tracking-widest text-sm hover:bg-[#f0e6d2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-none shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoading ? "Broadcasting..." : "Create Game"}
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
