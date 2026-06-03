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

@gl.evm.contract_interface
class _Recipient:
    class View:
        pass
    class Write:
        pass

class DiceBattle(gl.Contract):
    """
    AI Dice Battle — Intelligent Contract on GenLayer.

    Flow:
      1. Player 1 deploys the contract (becomes creator).
      2. Player 2 calls join_battle() to enter.
      3. Either player calls resolve_battle() with dice rolls.
         The AI validator verifies the rolls are valid (1-6) and determines the winner.
      4. Anyone can call get_state() to read the full battle result.
    """

    # --- State ---
    player1: str          # address of the creator
    player2: str          # address of the opponent (empty until joined)
    winner: str           # address of winner, or "DRAW", or "" if not resolved
    dice1: u256           # player1's dice roll (1-6)
    dice2: u256           # player2's dice roll (1-6)
    wager: u256           # wager amount in GEN (informational, stored for UI)
    status: str           # "OPEN" | "IN_PROGRESS" | "RESOLVED"

    def __init__(self, player1: str, wager: u256) -> None:
        self.player1 = player1
        self.player2 = ""
        self.winner = ""
        self.dice1 = u256(0)
        self.dice2 = u256(0)
        self.wager = wager
        self.status = "OPEN"

    # --- Write Methods ---

    @gl.public.write.payable
    def fund_creator_wager(self) -> None:
        assert gl.message.value == self.wager, "Must send exact wager amount"
        # We assume player1 is calling this, just verifying value
        
    @gl.public.write.payable
    def join_battle(self, player2: str) -> None:
        """Player 2 joins the open battle."""
        # BUG FIX: original had no guards — anyone could overwrite player2 anytime
        assert self.status == "OPEN", "Battle is not open for joining"
        assert player2 != "", "Player2 address cannot be empty"
        assert player2 != self.player1, "Cannot battle yourself"
        assert self.player2 == "", "Battle already has an opponent"

        self.player2 = player2
        self.status = "IN_PROGRESS"

    @gl.public.write
    def resolve_battle(self, dice1: u256, dice2: u256) -> None:
        """
        Resolve the battle with the provided dice rolls.
        """
        assert self.status == "IN_PROGRESS", "Battle must have two players before resolving"
        assert self.player2 != "", "No opponent has joined yet"

        # Validate dice range (1-6)
        assert dice1 >= u256(1) and dice1 <= u256(6), "Player1 dice must be between 1 and 6"
        assert dice2 >= u256(1) and dice2 <= u256(6), "Player2 dice must be between 1 and 6"

        self.dice1 = dice1
        self.dice2 = dice2

        # AI-powered validation: ask the validator to confirm the outcome is fair
        result = gl.eq_principle_prompt_comparative(
            lambda: gl.get_webpage(""),  # no web call needed; using pure logic check
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
            # Fallback to deterministic logic if AI returns unexpected output
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

    # --- View Methods ---

    @gl.public.view
    def get_winner(self) -> str:
        """Returns the winner address, 'DRAW', or '' if not yet resolved."""
        return self.winner

    @gl.public.view
    def get_state(self) -> dict:
        """
        Returns the full battle state as a dict.
        """
        return {
            "player1": self.player1,
            "player2": self.player2,
            "winner": self.winner,
            "dice1": int(self.dice1),
            "dice2": int(self.dice2),
            "wager": int(self.wager),
            "status": self.status,
        }

    @gl.public.view
    def get_status(self) -> str:
        """Returns current battle status: 'OPEN', 'IN_PROGRESS', or 'RESOLVED'."""
        return self.status`;
};
