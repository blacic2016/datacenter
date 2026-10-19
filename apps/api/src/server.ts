import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runSeeds } from './db/seed.js';
import { runPhotoAndAiMigrations } from './db/schema-photos.js';
import { authRouter } from './modules/auth/auth.router.js';
import { projectsRouter } from './modules/projects/projects.router.js';
import { stepsRouter } from './modules/steps/steps.router.js';
import { usersRouter } from './modules/users/users.router.js';
import { templatesRouter } from './modules/templates/templates.router.js';
import { syncRouter } from './modules/sync/sync.router.js';
import { aiRouter } from './modules/ai/ai.router.js';
import { photosRouter } from './modules/photos/photos.router.js';

dotenv.config();

// Inicializar SQLite con migraciones y semillas
runSeeds();
runPhotoAndAiMigrations();

const app = express();
const port = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Daedalous Data Center Engineering API',
    db: 'sqlite3 (con sincronización a postgres)',
    features: ['photos_by_area', 'ai_analysis_gemini_ollama'],
    timestamp: new Date().toISOString(),
  });
});

// Rutas modulares
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/steps', stepsRouter);
app.use('/api/users', usersRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/sync', syncRouter);
app.use('/api/ai', aiRouter);
app.use('/api', photosRouter);

app.listen(port, () => {
  console.log(`🚀 Daedalous API escuchando en http://localhost:${port}`);
});
