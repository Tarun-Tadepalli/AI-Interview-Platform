"""Best-effort refresh of the authenticated user's Ask AI vector index.

The normal Ask AI request also reconciles the index before retrieval. This helper
makes resume/speaking/interview saves refresh it shortly after the API response.
Indexing failures never roll back successfully saved practice data.
"""
import logging

logger = logging.getLogger("app.ask_ai.rag.refresh")


def refresh_user_index(user_id: int) -> None:
    try:
        # Lazy import avoids a module import cycle: ask_ai_routes imports the RAG service.
        from app.routes.ask_ai_routes import _load_private_account_context
        from app.services.ask_ai_rag_service import _index_context

        context = _load_private_account_context(int(user_id), "progress")
        if context.strip():
            _index_context(int(user_id), context)
    except Exception as exc:
        logger.warning(
            "Ask AI index refresh skipped for user scope (%s)",
            type(exc).__name__,
        )
