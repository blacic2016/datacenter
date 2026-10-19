import crypto from 'node:crypto';
import { db } from './sqlite.js';

export function runPhotoAndAiMigrations(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_photos (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      area TEXT NOT NULL,
      filename TEXT NOT NULL,
      url TEXT NOT NULL,
      tag TEXT NOT NULL,
      auto_tags TEXT NOT NULL,
      observation TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      provider TEXT NOT NULL DEFAULT 'gemini',
      gemini_api_key TEXT,
      gemini_model TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
      ollama_url TEXT NOT NULL DEFAULT 'http://localhost:11434',
      ollama_model TEXT NOT NULL DEFAULT 'llama3',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO ai_config (id, provider, gemini_model, ollama_url, ollama_model)
    VALUES (1, 'gemini', 'gemini-1.5-flash', 'http://localhost:11434', 'llama3');
  `);
  console.log('✅ Tablas project_photos y ai_config listas.');
}
