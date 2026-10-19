import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getAiConfig, saveAiConfig, generateAiCompletion } from './ai.service.js';

export const aiRouter = Router();

aiRouter.use(requireAuth);

aiRouter.get('/config', (_req, res) => {
  const cfg = getAiConfig();
  res.json({
    ...cfg,
    geminiApiKey: cfg.geminiApiKey ? `${cfg.geminiApiKey.substring(0, 6)}...` : '',
    hasGeminiKey: Boolean(cfg.geminiApiKey),
  });
});

aiRouter.post('/config', (req, res) => {
  const { provider, geminiApiKey, geminiModel, ollamaUrl, ollamaModel } = req.body ?? {};
  saveAiConfig({
    provider,
    geminiApiKey: geminiApiKey || undefined,
    geminiModel,
    ollamaUrl,
    ollamaModel,
  });
  res.json({ message: 'Configuración de IA guardada exitosamente' });
});

aiRouter.post('/test', async (_req, res) => {
  try {
    const testPrompt = 'Responde en JSON: {"status": "ok", "message": "Conexión exitosa"}';
    const raw = await generateAiCompletion(testPrompt);
    res.json({ success: true, result: JSON.parse(raw) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function fallbackAnalysis(text: string) {
  const lower = text.toLowerCase();
  const rackMatch = lower.match(/(\d+)\s*(?:racks?|gabinetes?)/);
  const kwMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kw|kilos?)/);
  const racks = rackMatch ? parseInt(rackMatch[1]!, 10) : 4;
  const kw = kwMatch ? parseFloat(kwMatch[1]!) : 5.0;
  const rated = lower.includes('redundant') || lower.includes('tier 3') || lower.includes('rated 3') ? 3 : 2;

  return {
    proposalSummary: `Propuesta preliminar basada en requerimiento del cliente: Solución modular de Data Center diseñada bajo estándar ANSI/TIA-942-C para albergar ${racks} racks IT con una densidad estimada de ${kw} kW por rack. Se contempla infraestructura redundante en climatización y energía eléctrica con topología Rated ${rated}.`,
    expectedRacks: racks,
    expectedKwPerRack: kw,
    suggestedRated: rated,
    precheckItems: [
      { question: 'Ubicación alejada de riesgos de inundación', applies: true, explanation: 'TIA-942 §4.2 exige evaluar cotas de inundación de 100 años y proximidad a tuberías principales.' },
      { question: 'Acceso controlado al edificio y sala', applies: true, explanation: 'TIA-942 §Seguridad física requiere múltiples barreras de acceso con registro auditable.' },
      { question: 'Disponibilidad de acometida eléctrica de capacidad', applies: true, explanation: 'Se estima demanda IT inicial de ' + (racks * kw).toFixed(1) + ' kW más cargas de climatización y UPS.' },
      { question: 'Ruta de entrada para fibra óptica redundante', applies: true, explanation: 'TIA-942 §Telecomunicaciones exige dos Entrance Rooms (ER) o rutas diversas en Rated ≥ 3.' },
      { question: 'Capacidad estructural de losa (piso)', applies: true, explanation: 'Carga de racks con alta densidad requiere verificación mínima de 12 kPa por arquitecto.' },
    ],
  };
}

aiRouter.post('/analyze-requirement', async (req, res) => {
  const { text, projectName, clientName } = req.body ?? {};
  if (!text || text.trim().length < 5) {
    res.status(400).json({ error: 'Requerimiento de texto demasiado corto' });
    return;
  }

  const prompt = `Actúa como Consultor Senior en Infraestructura de Data Centers certificado en ANSI/TIA-942-C.
Analiza el siguiente requerimiento escrito del cliente para el proyecto "${projectName || 'Data Center'}" del cliente "${clientName || 'Cliente'}":

"${text}"

Genera una respuesta estrictamente en JSON con la siguiente estructura:
{
  "proposalSummary": "Texto detallado de propuesta técnica fundamentada en TIA-942",
  "expectedRacks": 4,
  "expectedKwPerRack": 5.0,
  "suggestedRated": 2,
  "precheckItems": [
    {
      "question": "Nombre de la verificación",
      "applies": true,
      "explanation": "Explicación técnica de por qué aplica y referencia a TIA-942"
    }
  ]
}`;

  try {
    const raw = await generateAiCompletion(prompt);
    const parsed = JSON.parse(raw);
    res.json({ success: true, analysis: parsed });
  } catch (err: any) {
    // Si no hay API key o hay error de red, usamos análisis de contingencia explicativo
    console.warn(`[AI Engine] Usando análisis de contingencia: ${err.message}`);
    const fb = fallbackAnalysis(text);
    res.json({
      success: true,
      analysis: fb,
      notice: `Análisis generado mediante motor heurístico local (${err.message}). Configure Gemini u Ollama en Configuraciones para modelos LLM en línea.`,
    });
  }
});
