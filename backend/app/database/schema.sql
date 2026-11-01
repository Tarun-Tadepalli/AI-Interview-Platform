
-- ============================================================
-- AI INTERVIEW PLATFORM - COMPLETE DATABASE SCHEMA
-- PostgreSQL
-- ============================================================

-- Required extension for resume-based RAG / vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;


-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30),
    status VARCHAR(100) NOT NULL,
    college VARCHAR(255) NOT NULL,
    degree VARCHAR(255) NOT NULL,
    graduation_year INTEGER NOT NULL,
    target_role VARCHAR(100) NOT NULL,
    experience VARCHAR(50) NOT NULL,
    interview_focus VARCHAR(100) NOT NULL,
    programming_language VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. RESUMES
-- ============================================================

CREATE TABLE IF NOT EXISTS resumes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_resume_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT resumes_user_id_key UNIQUE (user_id)
);


-- ============================================================
-- 3. RESUME PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS resume_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    resume_id INTEGER,
    extracted_text TEXT NOT NULL DEFAULT '',
    skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    projects JSONB NOT NULL DEFAULT '[]'::jsonb,
    education JSONB NOT NULL DEFAULT '[]'::jsonb,
    experience_details JSONB NOT NULL DEFAULT '[]'::jsonb,
    certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
    extraction_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT resume_profiles_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT resume_profiles_resume_id_fkey
        FOREIGN KEY (resume_id)
        REFERENCES resumes(id)
        ON DELETE SET NULL,

    CONSTRAINT resume_profiles_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_resume_profiles_user
ON resume_profiles(user_id);


-- ============================================================
-- 4. INTERVIEW SESSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS interview_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    resume_id INTEGER,
    interview_type VARCHAR(30) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    focus VARCHAR(50) NOT NULL,
    total_questions INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    current_question_index INTEGER NOT NULL DEFAULT 0,
    overall_score NUMERIC(5,2),
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,

    CONSTRAINT interview_sessions_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT interview_sessions_resume_id_fkey
        FOREIGN KEY (resume_id)
        REFERENCES resumes(id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_user
ON interview_sessions(user_id, started_at DESC);


-- ============================================================
-- 5. INTERVIEW QUESTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS interview_questions (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL DEFAULT 'primary',
    parent_question_id BIGINT,
    answer_text TEXT,
    answer_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    correctness_score NUMERIC(5,2),
    relevance_score NUMERIC(5,2),
    clarity_score NUMERIC(5,2),
    completeness_score NUMERIC(5,2),
    feedback TEXT,
    suggested_answer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    answered_at TIMESTAMPTZ,

    CONSTRAINT interview_questions_session_id_fkey
        FOREIGN KEY (session_id)
        REFERENCES interview_sessions(id)
        ON DELETE CASCADE,

    CONSTRAINT interview_questions_parent_question_id_fkey
        FOREIGN KEY (parent_question_id)
        REFERENCES interview_questions(id)
        ON DELETE SET NULL,

    CONSTRAINT interview_questions_session_id_question_number_key
        UNIQUE (session_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_interview_questions_session
ON interview_questions(session_id, question_number);


-- ============================================================
-- 6. SPEAKING SESSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS speaking_sessions (
    id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL,
    mode VARCHAR(20) NOT NULL,
    difficulty VARCHAR(10) NOT NULL,
    question_count SMALLINT NOT NULL,
    prompts_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    cooldown_until TIMESTAMPTZ,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    overall_score NUMERIC(5,2),
    result_json JSONB,
    face_stats_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT speaking_sessions_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT speaking_sessions_difficulty_check
        CHECK (difficulty IN ('easy', 'medium', 'hard')),

    CONSTRAINT speaking_sessions_mode_check
        CHECK (mode IN ('general', 'behavioral', 'situational')),

    CONSTRAINT speaking_sessions_question_count_check
        CHECK (question_count >= 2 AND question_count <= 6),

    CONSTRAINT speaking_sessions_status_check
        CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

CREATE INDEX IF NOT EXISTS idx_speaking_sessions_user_completed
ON speaking_sessions(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_speaking_sessions_user_status
ON speaking_sessions(user_id, status);


-- ============================================================
-- 7. SPEAKING ANSWERS
-- ============================================================

CREATE TABLE IF NOT EXISTS speaking_answers (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    question_index SMALLINT NOT NULL,
    prompt TEXT NOT NULL,
    transcript TEXT NOT NULL DEFAULT '',
    words_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    metrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    duration_seconds NUMERIC(8,2) NOT NULL DEFAULT 0,
    transcript_confidence NUMERIC(5,4),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT speaking_answers_session_id_fkey
        FOREIGN KEY (session_id)
        REFERENCES speaking_sessions(id)
        ON DELETE CASCADE,

    CONSTRAINT speaking_answers_question_index_check
        CHECK (question_index >= 0 AND question_index <= 5),

    CONSTRAINT speaking_answers_session_id_question_index_key
        UNIQUE (session_id, question_index)
);

CREATE INDEX IF NOT EXISTS idx_speaking_answers_session
ON speaking_answers(session_id, question_index);


-- ============================================================
-- 8. TYPING SESSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS typing_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    mode VARCHAR(10) NOT NULL,
    time_limit INTEGER,
    word_limit INTEGER,
    punctuation BOOLEAN NOT NULL DEFAULT FALSE,
    numbers BOOLEAN NOT NULL DEFAULT FALSE,
    wpm INTEGER NOT NULL DEFAULT 0,
    raw_wpm INTEGER NOT NULL DEFAULT 0,
    accuracy INTEGER NOT NULL DEFAULT 100,
    correct_characters INTEGER NOT NULL DEFAULT 0,
    characters INTEGER NOT NULL DEFAULT 0,
    errors INTEGER NOT NULL DEFAULT 0,
    elapsed_seconds INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_typing_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT typing_sessions_mode_check
        CHECK (mode IN ('time', 'words'))
);


-- ============================================================
-- 9. ASK AI DOCUMENTS - VECTOR STORAGE
-- ============================================================

CREATE TABLE IF NOT EXISTS ask_ai_documents (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    source_key TEXT NOT NULL,
    content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    embedding VECTOR(384) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ask_ai_documents_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_ask_ai_documents_user_source
        UNIQUE (user_id, source_key)
);

CREATE INDEX IF NOT EXISTS idx_ask_ai_documents_user_id
ON ask_ai_documents(user_id);


-- ============================================================
-- END OF DATABASE SCHEMA
-- ============================================================
