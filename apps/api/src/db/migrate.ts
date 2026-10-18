import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './sqlite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runMigrations(): void {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const ddl = fs.readFileSync(schemaPath, 'utf-8');
  console.log('🔄 Ejecutando migraciones SQLite...');
  db.exec(ddl);
  console.log('✅ Migraciones completadas exitosamente.');
}

if (process.argv[1] === __filename) {
  runMigrations();
}
