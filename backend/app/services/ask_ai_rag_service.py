"""Small, user-scoped PostgreSQL/pgvector retrieval layer for Ask AI.

This service indexes the already-authorized account context assembled by ask_ai_routes.py.
It does not query other users' records and is intentionally best-effort: Ask AI can fall
back to its existing context if embedding/indexing is unavailable.
"""

import hashlib
import logging
import os
import re
from functools import lru_cache
from typing import Any

from app.database.connection import get_db_connection

logger = logging.getLogger("app.ask_ai.rag")
DEFAULT_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIMENSIONS = 384
CHUNK_SIZE = 900
CHUNK_OVERLAP = 120


@lru_cache(maxsize=1)
def _get_embedding_model():
    from sentence_transformers import SentenceTransformer

    model_name = os.getenv("ASK_AI_EMBEDDING_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL
    model = SentenceTransformer(model_name)
    dimension = model.get_sentence_embedding_dimension()
    if dimension != EMBEDDING_DIMENSIONS:
        raise ValueError(
            f"Ask AI expects {EMBEDDING_DIMENSIONS}-dimensional embeddings, "
            f"but {model_name} returns {dimension}. Update the migration before changing models."
        )
    return model


def _vector_literal(vector) -> str:
    """Serialize a numeric vector in pgvector's accepted textual format."""
    return "[" + ",".join(f"{float(value):.8f}" for value in vector) + "]"


def _split_chunks(text: str) -> list[str]:
    text = (text or "").strip()
    if not text:
        return []
    chunks = []
    start = 0
    length = len(text)
    while start < length:
        end = min(start + CHUNK_SIZE, length)
        if end < length:
            # Prefer a paragraph/word boundary rather than splitting in the middle of a word.
            boundary = max(text.rfind("\n", start, end), text.rfind(" ", start, end))
            if boundary > start + int(CHUNK_SIZE * 0.55):
                end = boundary
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= length:
            break
        start = max(end - CHUNK_OVERLAP, start + 1)
    return chunks


def _context_sections(account_context: str) -> list[tuple[str, str]]:
    """Split context into stable section names and text chunks."""
    sections = []
    for index, block in enumerate((account_context or "").split("\n\n")):
        block = block.strip()
        if not block:
            continue
        heading = block.splitlines()[0][:100]
        slug = re.sub(r"[^a-z0-9]+", "_", heading.lower()).strip("_") or "section"
        # Include the section position so repeated headings cannot overwrite one another.
        for chunk_index, chunk in enumerate(_split_chunks(block)):
            source_key = f"{index}:{slug[:80]}:{chunk_index}"
            sections.append((source_key, chunk))
    return sections


def _index_context(user_id: int, account_context: str) -> None:
    """Insert changed chunks and remove stale chunks for this user only."""
    sections = _context_sections(account_context)

    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT source_key, content_hash FROM ask_ai_documents WHERE user_id = %s",
                (user_id,),
            )
            existing = {row[0]: row[1] for row in cursor.fetchall()}
            current_keys = {key for key, _ in sections}
            stale_keys = [key for key in existing if key not in current_keys]
            if stale_keys:
                cursor.execute(
                    "DELETE FROM ask_ai_documents WHERE user_id = %s AND source_key = ANY(%s)",
                    (user_id, stale_keys),
                )

            # If the user's current context is empty, remove their old index entries
            # rather than allowing Ask AI to retrieve stale personal information.
            if not sections:
                connection.commit()
                return

            changed = []
            for source_key, content in sections:
                digest = hashlib.sha256(content.encode("utf-8")).hexdigest()
                if existing.get(source_key) != digest:
                    changed.append((source_key, content, digest))

            if changed:
                model = _get_embedding_model()
                vectors = model.encode(
                    [item[1] for item in changed],
                    normalize_embeddings=True,
                    show_progress_bar=False,
                    convert_to_numpy=True,
                )
                for (source_key, content, digest), vector in zip(changed, vectors):
                    cursor.execute(
                        """
                        INSERT INTO ask_ai_documents
                            (user_id, source_key, content, content_hash, embedding, updated_at)
                        VALUES (%s, %s, %s, %s, %s::vector, NOW())
                        ON CONFLICT (user_id, source_key) DO UPDATE SET
                            content = EXCLUDED.content,
                            content_hash = EXCLUDED.content_hash,
                            embedding = EXCLUDED.embedding,
                            updated_at = NOW()
                        """,
                        (user_id, source_key, content, digest, _vector_literal(vector)),
                    )
        connection.commit()
    except Exception:
        if connection is not None:
            connection.rollback()
        raise
    finally:
        if connection is not None:
            connection.close()


def retrieve_relevant_context(user_id: int, question: str, account_context: str, limit: int = 5) -> str:
    """Index changed account-context chunks and return semantically closest chunks.

    The caller should catch failures and continue using its existing account context.
    """
    question = (question or "").strip()
    if not question or not account_context:
        return ""

    _index_context(user_id, account_context)
    model = _get_embedding_model()
    query_vector = model.encode(
        question,
        normalize_embeddings=True,
        show_progress_bar=False,
        convert_to_numpy=True,
    )
    vector_text = _vector_literal(query_vector)

    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT content
                FROM ask_ai_documents
                WHERE user_id = %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (user_id, vector_text, max(1, min(int(limit), 8))),
            )
            rows = cursor.fetchall()
        return "\n\n".join(row[0] for row in rows if row and row[0])
    finally:
        if connection is not None:
            connection.close()


def get_rag_status() -> dict[str, Any]:
    """Safe local status check; never exposes connection strings or secrets."""
    try:
        model = _get_embedding_model()
        return {"available": True, "dimensions": model.get_sentence_embedding_dimension()}
    except Exception as error:
        logger.warning("Ask AI RAG model is not ready (%s)", type(error).__name__)
        return {"available": False, "reason": type(error).__name__}
