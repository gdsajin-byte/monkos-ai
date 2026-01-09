-- D1 Database Schema for MONK AI Studio

CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  model TEXT,
  mode TEXT,
  aspect_ratio TEXT,
  image_size TEXT,
  safety_level TEXT,
  timestamp INTEGER NOT NULL,
  project_id TEXT DEFAULT 'INTERNAL',
  comment TEXT,
  tags TEXT,
  style_analysis TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timestamp ON images(timestamp DESC);
CREATE INDEX idx_project_id ON images(project_id);
CREATE INDEX idx_mode ON images(mode);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  timestamp INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usage_ip ON usage_logs(ip_address, timestamp DESC);
CREATE INDEX idx_usage_timestamp ON usage_logs(timestamp DESC);

-- Query examples:
-- Get recent images: SELECT * FROM images ORDER BY timestamp DESC LIMIT 50;
-- Get by mode: SELECT * FROM images WHERE mode = 'T2I' ORDER BY timestamp DESC;
-- Get by project: SELECT * FROM images WHERE project_id = 'INTERNAL';
-- Get daily usage: SELECT COUNT(*) FROM usage_logs WHERE timestamp > ?;
-- Get IP usage: SELECT SUM(request_count) FROM usage_logs WHERE ip_address = ? AND timestamp > ?;
