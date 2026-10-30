import math

from app.models.typing_model import (
    save_typing_session,
    get_typing_history,
)


def calculate_typing_stats(
    typed_text,
    target_text,
    elapsed_seconds,
):
    correct = 0

    for index, character in enumerate(typed_text):

        if (
            index < len(target_text)
            and character == target_text[index]
        ):
            correct += 1

    characters = len(typed_text)

    errors = characters - correct

    elapsed_minutes = max(
        elapsed_seconds / 60,
        1 / 60
    )

    raw_wpm = math.floor(
        ((characters / 5) / elapsed_minutes) + 0.5
    )

    wpm = math.floor(
        ((correct / 5) / elapsed_minutes) + 0.5
    )

    if characters:
        accuracy = math.floor(
            ((correct / characters) * 100) + 0.5
        )
    else:
        accuracy = 100

    return {
        "wpm": max(0, wpm),
        "raw_wpm": max(0, raw_wpm),
        "accuracy": max(0, min(100, accuracy)),
        "correct_characters": correct,
        "characters": characters,
        "errors": errors,
    }


def create_typing_result(user_id, data):

    stats = calculate_typing_stats(
        typed_text=data.typed_text,
        target_text=data.target_text,
        elapsed_seconds=data.elapsed_seconds,
    )

    row = save_typing_session(
        user_id=user_id,
        mode=data.mode,
        time_limit=data.time_limit,
        word_limit=data.word_limit,
        punctuation=data.punctuation,
        numbers=data.numbers,
        wpm=stats["wpm"],
        raw_wpm=stats["raw_wpm"],
        accuracy=stats["accuracy"],
        correct_characters=stats["correct_characters"],
        characters=stats["characters"],
        errors=stats["errors"],
        elapsed_seconds=data.elapsed_seconds,
    )

    return {
        "id": row[0],
        "user_id": row[1],
        "mode": row[2],
        "time_limit": row[3],
        "word_limit": row[4],
        "punctuation": row[5],
        "numbers": row[6],
        "wpm": row[7],
        "raw_wpm": row[8],
        "accuracy": row[9],
        "correct_characters": row[10],
        "characters": row[11],
        "errors": row[12],
        "elapsed_seconds": row[13],
        "created_at": row[14],
        "stats": stats,
    }


def get_user_typing_history(user_id, limit=50):

    rows = get_typing_history(
        user_id=user_id,
        limit=limit,
    )

    return [
        {
            "id": row[0],
            "mode": row[1],
            "time_limit": row[2],
            "word_limit": row[3],
            "punctuation": row[4],
            "numbers": row[5],
            "wpm": row[6],
            "raw_wpm": row[7],
            "accuracy": row[8],
            "correct_characters": row[9],
            "characters": row[10],
            "errors": row[11],
            "elapsed_seconds": row[12],
            "created_at": row[13],
        }
        for row in rows
    ]