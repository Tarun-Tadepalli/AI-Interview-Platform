-- Run this only in ai_interview_db after confirming the vector extension is installed.
-- This adds a separate retrieval table; it does not alter existing practice tables.
CREATE TABLE IF NOT EXISTS public.ask_ai_documents (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    source_key TEXT NOT NULL,
    content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    embedding VECTOR(384) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ask_ai_documents_user_source UNIQUE (user_id, source_key)
);

CREATE INDEX IF NOT EXISTS idx_ask_ai_documents_user_id
    ON public.ask_ai_documents (user_id);

-- Optional later, once enough chunks exist to benefit from an approximate index:
-- CREATE INDEX IF NOT EXISTS idx_ask_ai_documents_embedding_hnsw
--     ON public.ask_ai_documents USING hnsw (embedding vector_cosine_ops);
