export const getDiceBattleCode = async () => {
    try {
        const response = await fetch('/contracts/dice_battle.py');
        if (response.ok) {
           return await response.text();
        }
    } catch {}
    
    // Fallback bundled code
    return `# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import typing

class DiceBattle(gl.Contract):
    player1: str
    player2: str
    winner: str
    dice1: u256
    dice2: u256

    def __init__(self, player1: str):
        self.player1 = player1
        self.player2 = ""
        self.winner = ""
        self.dice1 = u256(0)
        self.dice2 = u256(0)

    @gl.public.write
    def join_battle(self, player2: str) -> None:
        self.player2 = player2

    @gl.public.write
    def resolve_battle(self, dice1: u256, dice2: u256) -> None:
        self.dice1 = dice1
        self.dice2 = dice2

        if dice1 > dice2:
            self.winner = self.player1
        elif dice2 > dice1:
            self.winner = self.player2
        else:
            self.winner = "DRAW"

    @gl.public.view
    def get_winner(self) -> str:
        return self.winner`;
};
