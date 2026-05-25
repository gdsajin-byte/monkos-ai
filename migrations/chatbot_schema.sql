-- ============================================================
-- MONK Chatbot D1 Schema Migration
-- Target: monk-db (existing D1 database)
-- Date: 2026-05-25
-- ============================================================

-- 1. RAG Knowledge Table
CREATE TABLE IF NOT EXISTS rag_knowledge (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    locale TEXT NOT NULL DEFAULT 'ko',
    title TEXT NOT NULL,
    keywords TEXT NOT NULL,
    content TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rag_cat ON rag_knowledge(category, locale);

-- 2. FTS5 Virtual Table for Full-Text Search
CREATE VIRTUAL TABLE IF NOT EXISTS rag_knowledge_fts USING fts5(
    title, keywords, content,
    content='rag_knowledge',
    content_rowid='rowid'
);

-- 3. FTS5 Sync Triggers
CREATE TRIGGER IF NOT EXISTS rag_ai AFTER INSERT ON rag_knowledge BEGIN
    INSERT INTO rag_knowledge_fts(rowid, title, keywords, content)
    VALUES (new.rowid, new.title, new.keywords, new.content);
END;

CREATE TRIGGER IF NOT EXISTS rag_ad AFTER DELETE ON rag_knowledge BEGIN
    INSERT INTO rag_knowledge_fts(rag_knowledge_fts, rowid, title, keywords, content)
    VALUES ('delete', old.rowid, old.title, old.keywords, old.content);
END;

CREATE TRIGGER IF NOT EXISTS rag_au AFTER UPDATE ON rag_knowledge BEGIN
    INSERT INTO rag_knowledge_fts(rag_knowledge_fts, rowid, title, keywords, content)
    VALUES ('delete', old.rowid, old.title, old.keywords, old.content);
    INSERT INTO rag_knowledge_fts(rowid, title, keywords, content)
    VALUES (new.rowid, new.title, new.keywords, new.content);
END;

-- 4. Chat Logs Table (Firestore replacement)
CREATE TABLE IF NOT EXISTS chat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    role TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_logs_session ON chat_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_logs_channel ON chat_logs(channel, created_at);
