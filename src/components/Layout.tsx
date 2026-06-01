import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { WalletConnect } from "./WalletConnect";
import { Home, Swords, Trophy } from "lucide-react";
import { cn } from "../lib/utils";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const Layout = () => {
  const location = useLocation();

  const navItems = [
    { name: "Arena", path: "/", icon: Home },
    { name: "History", path: "/lobby", icon: Swords }, // using Lobby as History/Open battles for now
    { name: "Leaderboard", path: "/leaderboard", icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#e0e0e0] font-sans selection:bg-[#d4af37]/30 flex flex-col relative overflow-hidden">
      <ToastContainer theme="dark" position="bottom-right" />
      {/* Header */}
      <header className="relative z-10 border-b border-[#2a2a2e] bg-[#121216] px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#d4af37] to-[#8b6b10] rounded-lg rotate-12 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-transform duration-300 group-hover:rotate-[24deg]">
              <span className="text-black font-bold text-xl -rotate-12 transition-transform duration-300 group-hover:-rotate-[24deg]">⚅</span>
            </div>
            <h1 className="text-2xl font-serif font-bold tracking-tight text-[#f0e6d2] hidden sm:block">
              AI DICE <span className="text-[#d4af37]">BATTLE</span>
            </h1>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium uppercase tracking-widest transition-colors duration-300",
                    isActive
                      ? "text-[#d4af37]"
                      : "text-[#a0a0a5] hover:text-white"
                  )}
                >
                  <item.icon size={16} className={cn(isActive ? "animate-pulse shadow-[#d4af37]" : "opacity-70")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Wallet Info */}
          <WalletConnect />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#0d0d11] border-t border-[#2a2a2e] px-4 md:px-8 py-3 flex justify-between items-center relative z-10">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full shadow-[0_0_8px_rgba(212,175,55,0.8)]"></div>
            <span className="text-[10px] uppercase tracking-widest text-[#6e6e76]">
              Contract: <span className="text-[#a0a0a5] font-mono">GenLayer.DiceBattle.v1.2</span>
            </span>
          </div>
        </div>
        <p className="text-[10px] text-[#6e6e76] uppercase tracking-widest hidden sm:block">
          Powered by <span className="text-white font-bold">GenLayer Intelligent Contracts</span>
        </p>
      </footer>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#121216]/90 backdrop-blur-xl border-t border-[#2a2a2e] z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 transition-colors",
                  isActive ? "text-[#d4af37]" : "text-[#6e6e76] hover:text-[#a0a0a5]"
                )}
              >
                <item.icon size={20} />
                <span className="text-[10px] font-medium uppercase tracking-widest">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
