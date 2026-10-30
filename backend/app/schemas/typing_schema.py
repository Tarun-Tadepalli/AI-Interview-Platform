from typing import Literal

from pydantic import BaseModel, Field, model_validator


class TypingResultRequest(BaseModel):

    mode: Literal["time", "words"]

    time_limit: int | None = None
    word_limit: int | None = None

    punctuation: bool = False
    numbers: bool = False

    typed_text: str
    target_text: str

    elapsed_seconds: int = Field(
        ge=1,
        le=3600
    )

    @model_validator(mode="after")
    def validate_test_configuration(self):

        if self.mode == "time":

            if self.time_limit not in [10, 20, 30, 40, 50, 60]:
                raise ValueError(
                    "Invalid time limit."
                )

        if self.mode == "words":

            if self.word_limit not in [10, 25, 50, 100]:
                raise ValueError(
                    "Invalid word limit."
                )

        return self