# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *

@gl.evm.contract_interface
class _Recipient:
    class View:
        pass
    class Write:
        pass

class DiceBattle(gl.Contract):
    """
    AI Dice Battle — Intelligent Contract on GenLayer.
    """

    player1: str
    player2: str
    winner: str
    dice1: u256
    dice2: u256
    wager: u256
    status: str

    def __init__(self) -> None:
        self.player1 = ""
        self.player2 = ""
        self.winner = ""
        self.dice1 = u256(0)
        self.dice2 = u256(0)
        self.wager = u256(0)
        self.status = "INITIALIZING"

    @gl.public.write.payable
    def initialize_battle(self, player1: str, wager: u256) -> None:
        assert self.status == "INITIALIZING", "Already initialized"
        assert gl.message.value == wager, "Must send exact wager amount"
        self.player1 = player1
        self.wager = wager
        self.status = "OPEN"

    @gl.public.write.payable
    def join_battle(self, player2: str) -> None:
        """Player 2 joins the open battle."""
        assert self.status == "OPEN", "Battle is not open for joining"
        assert player2 != "", "Player2 address cannot be empty"
        assert player2 != self.player1, "Cannot battle yourself"
        assert self.player2 == "", "Battle already has an opponent"
        assert gl.message.value == self.wager, "Must send exact wager amount"

        self.player2 = player2
        self.status = "IN_PROGRESS"

    @gl.public.write
    def resolve_battle(self, dice1: u256, dice2: u256) -> None:
        assert self.status == "IN_PROGRESS", "Battle must have two players before resolving"
        assert self.player2 != "", "No opponent has joined yet"

        self.dice1 = dice1
        self.dice2 = dice2

        # AI-powered validation
        result = gl.eq_principle_prompt_comparative(
            lambda: gl.get_webpage(""),  # no web call needed
            task=f"Two players rolled dice. Player1 rolled {int(dice1)}, Player2 rolled {int(dice2)}. "
                 f"Both values are between 1 and 6. "
                 f"Who wins? Reply ONLY with: 'player1', 'player2', or 'draw'.",
            criteria="Reply with exactly one of: 'player1', 'player2', or 'draw' — all lowercase, no punctuation."
        )

        verdict = result.strip().lower()

        if verdict == "player1":
            self.winner = self.player1
            _Recipient(Address(self.player1)).emit_transfer(value=self.wager * u256(2))
        elif verdict == "player2":
            self.winner = self.player2
            _Recipient(Address(self.player2)).emit_transfer(value=self.wager * u256(2))
        else:
            # Fallback to deterministic logic
            if dice1 > dice2:
                self.winner = self.player1
                _Recipient(Address(self.player1)).emit_transfer(value=self.wager * u256(2))
            elif dice2 > dice1:
                self.winner = self.player2
                _Recipient(Address(self.player2)).emit_transfer(value=self.wager * u256(2))
            else:
                self.winner = "DRAW"
                _Recipient(Address(self.player1)).emit_transfer(value=self.wager)
                _Recipient(Address(self.player2)).emit_transfer(value=self.wager)

        self.status = "RESOLVED"

    @gl.public.view
    def get_winner(self) -> str:
        return self.winner
    
    @gl.public.view
    def get_status(self) -> str:
        return self.status

