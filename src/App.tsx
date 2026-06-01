import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "./context/GameContext";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Lobby } from "./pages/Lobby";
import { Battle } from "./pages/Battle";
import { Leaderboard } from "./pages/Leaderboard";

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="lobby" element={<Lobby />} />
            <Route path="battle/:id" element={<Battle />} />
            <Route path="leaderboard" element={<Leaderboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GameProvider>
  );
}
