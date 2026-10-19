import { db } from '../../db/sqlite.js';

export interface AiConfig {
  provider: 'gemini' | 'ollama';
  geminiApiKey?: string;
  geminiModel: string;
  ollamaUrl: string;
  ollamaModel: string;
}

export function getAiConfig(): AiConfig {
  const row = db.get('SELECT * FROM ai_config WHERE id = 1');
  return {
    provider: (row?.provider as 'gemini' | 'ollama') || 'gemini',
    geminiApiKey: row?.gemini_api_key || process.env.GEMINI_API_KEY || '',
    geminiModel: row?.gemini_model || 'gemini-1.5-flash',
    ollamaUrl: row?.ollama_url || 'http://localhost:11434',
    ollamaModel: row?.ollama_model || 'llama3',
  };
}

export function saveAiConfig(cfg: Partial<AiConfig>): void {
  db.run(
    `UPDATE ai_config SET
       provider = COALESCE(?, provider),
       gemini_api_key = COALESCE(?, gemini_api_key),
       gemini_model = COALESCE(?, gemini_model),
       ollama_url = COALESCE(?, ollama_url),
       ollama_model = COALESCE(?, ollama_model),
       updated_at = datetime('now')
     WHERE id = 1`,
    [cfg.provider, cfg.geminiApiKey, cfg.geminiModel, cfg.ollamaUrl, cfg.ollamaModel]
  );
}

async function callGemini(prompt: string, apiKey: string, model: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error Gemini HTTP ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
}

async function callOllama(prompt: string, host: string, model: string): Promise<string> {
  const url = `${host.replace(/\/$/, '')}/api/generate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false, format: 'json' }),
  });
  if (!res.ok) {
    throw new Error(`Error Ollama HTTP ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.response || '{}';
}

export async function generateAiCompletion(prompt: string): Promise<string> {
  const cfg = getAiConfig();
  if (cfg.provider === 'gemini') {
    if (!cfg.geminiApiKey) {
      throw new Error('API Key de Gemini no configurada. Ingrésela en la pestaña Configuraciones.');
    }
    return callGemini(prompt, cfg.geminiApiKey, cfg.geminiModel);
  }
  return callOllama(prompt, cfg.ollamaUrl, cfg.ollamaModel);
}
