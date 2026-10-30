from typing import Any, Dict, List

from pydantic import BaseModel


class ProgressSummary(BaseModel):
    sessions: int = 0
    currentWpm: float = 0
    currentRawWpm: float = 0
    currentAccuracy: float = 0
    currentErrors: int = 0
    bestWpm: float = 0
    bestAccuracy: float = 0
    streak: int = 0
    currentScore: float = 0
    bestScore: float = 0
    averageScore: float = 0
    currentMode: str = ""
    currentDifficulty: str = ""
    currentDuration: float = 0


class ProgressResponse(BaseModel):
    success: bool
    module: str
    period: str
    summary: ProgressSummary
    history: List[Dict[str, Any]]