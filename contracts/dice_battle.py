import random

class AI_DiceBattle:
    """
    GenLayer Intelligent Contract for AI Dice Battle
    
    This contract handles the wager logic, roll generation, and AI narration.
    """
    def __init__(self):
        self.battles = {}
        self.battle_count = 0
        self.leaderboard = {}
        
    def create_battle(self, creator: str, wager: int) -> int:
        self.battle_count += 1
        self.battles[self.battle_count] = {
            "creator": creator,
            "wager": wager,
            "status": "OPEN",
            "opponent": None,
            "creator_roll": 0,
            "opponent_roll": 0,
            "winner": None,
            "story": ""
        }
        return self.battle_count
        
    def join_and_resolve(self, battle_id: int, opponent: str) -> dict:
        battle = self.battles.get(battle_id)
        if not battle or battle["status"] != "OPEN":
            raise ValueError("Battle not open or does not exist")
            
        battle["opponent"] = opponent
        battle["status"] = "RESOLVED"
        
        # Roll dice (1-6)
        # Ties are automatically resolved by repeating until different
        creator_roll = random.randint(1, 6)
        opponent_roll = random.randint(1, 6)
        while creator_roll == opponent_roll:
            creator_roll = random.randint(1, 6)
            opponent_roll = random.randint(1, 6)
            
        battle["creator_roll"] = creator_roll
        battle["opponent_roll"] = opponent_roll
        
        # Determine winner
        if creator_roll > opponent_roll:
            winner = battle["creator"]
            loser = opponent
        else:
            winner = opponent
            loser = battle["creator"]
            
        battle["winner"] = winner
        
        # Update leaderboard
        for p in [winner, loser]:
            if p not in self.leaderboard:
                self.leaderboard[p] = {"wins": 0, "battles": 0}
            self.leaderboard[p]["battles"] += 1
            
        self.leaderboard[winner]["wins"] += 1
        
        # In a real GenLayer contract, we would use the native AI runtime to generate narration:
        # e.g., result = genlayer.call_llm(...)
        # We will mock it here to show the structure.
        battle["story"] = self._generate_ai_story(winner, loser, creator_roll, opponent_roll)
        
        return battle

    def _generate_ai_story(self, winner: str, loser: str, roll1: int, roll2: int) -> str:
        # Prompt to GenLayer's LLM adjudication model:
        prompt = f"Write a 2-4 sentence fun fantasy battle story. {winner} beat {loser}. Mention dice rolls {roll1} and {roll2}. Explain how the winner won."
        
        # Since this is a placeholder Python contract, we return a mock string.
        # In GenLayer this uses `genlayer.llm_call()` or similar function.
        return f"Rolling a mighty {max(roll1, roll2)} against a mere {min(roll1, roll2)}, {winner}'s elemental strike shattered {loser}'s guard. {winner} victorious!"
    
    def get_open_battles(self) -> dict:
        return {k: v for k, v in self.battles.items() if v["status"] == "OPEN"}
