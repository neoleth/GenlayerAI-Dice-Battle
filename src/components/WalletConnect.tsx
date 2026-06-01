import React from "react";
import { useGame } from "../context/GameContext";
import { shortenAddress } from "../lib/utils";
import { Wallet, LogOut, Copy } from "lucide-react";
import { toast } from "react-toastify";

export const WalletConnect = () => {
  const { walletAddress, genBalance, networkName, connectWallet, disconnectWallet } = useGame();

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied!");
  };

  if (walletAddress) {
    return (
      <div className="flex items-center gap-2">
        {networkName && (
           <div className="hidden md:flex border border-[#d4af37]/30 bg-[#16161c] px-3 py-1.5 rounded-md items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.6)]"></div>
             <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37]">{networkName}</span>
           </div>
        )}
        <button 
          onClick={() => handleCopy(walletAddress)}
          className="text-[#6e6e76] hover:text-[#d4af37] transition-colors p-2"
          title="Copy Address"
        >
          <Copy size={16} />
        </button>

        <button 
          onClick={disconnectWallet}
          className="bg-[#1e1e24] border border-[#d4af37]/30 px-4 py-2 rounded-md flex items-center gap-3 hover:bg-[#2a2a32] transition-all group"
          title="Disconnect Wallet"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          <span className="text-xs font-mono text-[#d4af37]">
            {shortenAddress(walletAddress)}
            {genBalance !== null ? ` | ${genBalance} GEN` : ''}
          </span>
          <LogOut size={14} className="text-[#6e6e76] group-hover:text-red-400 transition-colors ml-1" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      className="bg-[#d4af37] text-black px-4 py-2 rounded font-bold uppercase tracking-widest text-xs hover:bg-[#f0e6d2] transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
    >
      <Wallet size={16} />
      <span>Connect</span>
    </button>
  );
};
