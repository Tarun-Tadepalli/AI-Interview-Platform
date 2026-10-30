from typing import Literal
from pydantic import BaseModel, Field


PracticeMode = Literal["general", "behavioral", "situational"]
Difficulty = Literal["easy", "medium", "hard"]


class SpeakingStartRequest(BaseModel):
    mode: PracticeMode
    difficulty: Difficulty
    prompts: list[str] = Field(min_length=2, max_length=6)


class SpeakingFinishRequest(BaseModel):
    face_stats: dict = Field(default_factory=dict)
    camera_warnings: int = Field(default=0, ge=0, le=3)
    tab_switch_warnings: int = Field(default=0, ge=0, le=3)
    warning_count: int = Field(default=0, ge=0, le=3)
    termination_reason: Literal["warning_limit"] | None = None
