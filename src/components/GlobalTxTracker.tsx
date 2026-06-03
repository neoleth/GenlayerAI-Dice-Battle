import React from "react";
import { useGame } from "../context/GameContext";
import { ExternalLink, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const GlobalTxTracker = () => {
  const { txStatus, txHash } = useGame();

  if (txStatus === "idle") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed bottom-24 right-4 md:bottom-20 md:right-8 z-50 flex flex-col gap-2 w-[320px]"
      >
        <div className="bg-[#121216]/95 backdrop-blur border border-[#2a2a2e] p-4 rounded-xl shadow-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#a0a0a5]">Transaction Status</h4>
            {txStatus === "pending" || txStatus === "confirming" ? (
              <Loader2 size={16} className="text-[#d4af37] animate-spin" />
            ) : txStatus === "success" ? (
              <CheckCircle2 size={16} className="text-green-500" />
            ) : (
              <AlertCircle size={16} className="text-red-500" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">
              {txStatus === "pending" && "Waiting for approval..."}
              {txStatus === "confirming" && "Confirming on-chain..."}
              {txStatus === "success" && "Transaction Successful!"}
              {txStatus === "error" && "Transaction Failed"}
            </span>
          </div>

          {txHash && (
            <a 
              href={`${import.meta.env.VITE_EXPLORER || 'https://explorer-bradbury.genlayer.com'}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 bg-[#1e1e24] rounded border border-[#2a2a2e] hover:border-[#d4af37]/30 transition-colors group mt-2"
            >
              <span className="font-mono text-xs text-[#a0a0a5] group-hover:text-white transition-colors">
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </span>
              <ExternalLink size={14} className="text-[#6e6e76] group-hover:text-[#d4af37]" />
            </a>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
