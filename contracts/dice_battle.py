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
    def initialize_battle(self, wager: u256) -> None:
        assert self.status == "INITIALIZING", "Already initialized"
        assert gl.message.value == wager, "Must send exact wager amount"
        self.player1 = str(gl.message.sender_address)
        self.wager = wager
        self.status = "OPEN"

    @gl.public.write.payable
    def join_battle(self) -> None:
        assert self.status == "OPEN", "Battle is not open"
        caller = str(gl.message.sender_address)
        assert caller != self.player1, "Cannot join your own battle"
        assert gl.message.value == self.wager, "Must send exact wager amount"
        self.player2 = caller
        self.status = "IN_PROGRESS"

    @gl.public.write
    def resolve_battle(self) -> None:
        assert self.status == "IN_PROGRESS", "Battle is not in progress"
        caller = str(gl.message.sender_address)
        assert caller == self.player1 or caller == self.player2, "Not a participant"

        # AI-powered validation for resolving the outcome dynamically
        # Since get_random_int might not be available, we can rely on standard Python random if needed,
        # but eq_principle_prompt provides random-like consensus behavior for GenLayer validators.
        
        # We will use eq_principle_prompt to simulate the roll and determine winner.
        # But user requested gl.get_random_int(1, 6), let's use it as provided:
        
        dice1 = gl.get_random_int(1, 6)
        dice2 = gl.get_random_int(1, 6)

        self.dice1 = u256(dice1)
        self.dice2 = u256(dice2)

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

    @gl.public.view
    def get_battle_result(self) -> dict:
        return {
            "dice1": int(self.dice1),
            "dice2": int(self.dice2),
            "winner": self.winner,
            "status": self.status,
            "wager": int(self.wager),
        }

    @gl.public.view
    def get_state(self) -> dict:
        return {
            "player1": self.player1,
            "player2": self.player2,
            "winner": self.winner,
            "dice1": int(self.dice1),
            "dice2": int(self.dice2),
            "wager": int(self.wager),
            "status": self.status,
        }
