# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import typing

@gl.evm.contract_interface
class _Recipient:
    class View:
        pass
    class Write:
        pass

class DiceBattle(gl.Contract):

    player1: str
    player2: str
    winner: str

    dice1: u256
    dice2: u256
    wager: u256
    status: str

    def __init__(self, player1: str, wager: u256):
        self.player1 = player1
        self.player2 = ""
        self.winner = ""
        self.dice1 = u256(0)
        self.dice2 = u256(0)
        self.wager = wager
        self.status = "OPEN"

    @gl.public.write.payable
    def fund_creator_wager(self) -> None:
        assert gl.message.value == self.wager, "Must send exact wager amount"

    @gl.public.write.payable
    def join_battle(self, player2: str) -> None:
        self.player2 = player2
        self.status = "IN_PROGRESS"

    @gl.public.write
    def resolve_battle(self, dice1: u256, dice2: u256) -> None:
        self.dice1 = dice1
        self.dice2 = dice2

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
