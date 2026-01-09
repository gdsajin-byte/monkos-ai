-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    tier TEXT DEFAULT 'super_personal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TalentVectors Table
CREATE TABLE IF NOT EXISTS TalentVectors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    talent_type TEXT,
    description TEXT,
    identity_score REAL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- MatrixLinks Table
CREATE TABLE IF NOT EXISTS MatrixLinks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host_id TEXT,
    partner_id TEXT,
    project_name TEXT,
    status TEXT,
    FOREIGN KEY (host_id) REFERENCES Users(id),
    FOREIGN KEY (partner_id) REFERENCES Users(id)
);