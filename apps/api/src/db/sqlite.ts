import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.SQLITE_PATH || path.resolve(process.cwd(), 'data', 'daedalous.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const sqlite = new DatabaseSync(dbPath);

// Configuración de rendimiento y llaves foráneas para SQLite
sqlite.exec('PRAGMA foreign_keys = ON;');
sqlite.exec('PRAGMA journal_mode = WAL;');
sqlite.exec('PRAGMA synchronous = NORMAL;');

export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export const db = {
  exec(sql: string): void {
    sqlite.exec(sql);
  },

  query<T = any>(sql: string, params: any[] = []): T[] {
    const stmt = sqlite.prepare(sql);
    return stmt.all(...params) as T[];
  },

  get<T = any>(sql: string, params: any[] = []): T | undefined {
    const stmt = sqlite.prepare(sql);
    return stmt.get(...params) as T | undefined;
  },

  run(sql: string, params: any[] = []): RunResult {
    const stmt = sqlite.prepare(sql);
    return stmt.run(...params) as unknown as RunResult;
  },

  transaction<T>(fn: () => T): T {
    sqlite.exec('BEGIN TRANSACTION;');
    try {
      const res = fn();
      sqlite.exec('COMMIT;');
      return res;
    } catch (err) {
      sqlite.exec('ROLLBACK;');
      throw err;
    }
  },
};
