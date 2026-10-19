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
  const totalKw = (racks * kw).toFixed(1);
  const btu = Math.round(Number(totalKw) * 3412 * 1.3);
  const tons = (btu / 12000).toFixed(1);
  const rated = lower.includes('redundant') || lower.includes('tier 3') || lower.includes('rated 3') ? 3 : 2;

  return {
    proposalSummary: `Propuesta preliminar basada en el requerimiento del cliente: Data Center modular bajo ANSI/TIA-942-C diseñado para albergar ${racks} racks IT con una densidad estimada de ${kw} kW/rack (Demanda IT base: ${totalKw} kW). Infraestructura con nivel de disponibilidad Rated ${rated}.`,
    expectedRacks: racks,
    expectedKwPerRack: kw,
    suggestedRated: rated,
    precheckItems: [
      { question: 'Ubicación alejada de riesgos de inundación', applies: true, explanation: 'TIA-942 §4.2 exige evaluar cotas de inundación de 100 años y proximidad a tuberías de agua potable.' },
      { question: 'Acceso controlado al edificio y sala', applies: true, explanation: 'Seguridad física TIA-942 requiere esclusa o doble puerta con control biométrico/tarjeta.' },
      { question: 'Disponibilidad de acometida eléctrica de capacidad', applies: true, explanation: `Carga IT de ${totalKw} kW requiere acometida dimensionada con PUE 1.6 (~${(Number(totalKw) * 1.6).toFixed(1)} kW totales).` },
      { question: 'Ruta de entrada para fibra óptica redundante', applies: true, explanation: 'TIA-942 §Telecomunicaciones exige accesos de acometida subterránea diversos para Rated ≥ 2.' },
      { question: 'Capacidad estructural de losa (piso)', applies: true, explanation: 'Se requiere piso técnico con capacidad ≥ 12 kPa validado por arquitecto.' },
    ],
    stepRecommendations: {
      'step-02': `Obra Civil: Dimensionar sala de al menos ${(racks * 5).toFixed(0)} m² libres con altura losa ≥ 3.5m. Se requiere piso técnico elevado a 30 cm, impermeabilización epóxica y puerta de acceso de mínimo 1.00m x 2.13m.`,
      'step-03': `Espacio y Racks: Distribuir ${racks} racks en fila con pasillo frontal de 1.2m y posterior de 1.0m. Se recomienda contención de pasillo frío para optimizar la eficiencia térmica a ${kw} kW/rack.`,
      'step-04': `Carga Eléctrica: Capacidad IT neta de ${totalKw} kW. Considerar factor de potencia 0.9 y distribución trifásica en 220V/380V con objetivo PUE ≤ 1.6.`,
      'step-05': `Climatización: Carga térmica estimada de ${btu.toLocaleString()} BTU/h (~${tons} TR). Se requieren al menos 2 unidades de precisión perimetral bajo esquema N+1 con bandejas de condensado.`,
      'step-06': `Alimentación Eléctrica: Proveer 2 tomas 110V y 1 toma 220V por rack con doble barra PDU (Línea A y Línea B independientes) para garantizar redundancia activa.`,
      'step-07': `Tableros: Diseñar tablero general con bypass, tablero secundario de clima y barras de tierra TMGB conectadas a anillo perimetral.`,
      'step-08': `UPS: Se sugiere sistema UPS Online Doble Conversión de al menos ${Math.ceil(Number(totalKw) * 1.6 / 0.8)} kVA con autonomía de baterías de 15 minutos.`,
      'step-09': `Incendio: Sistema de detección temprana por aspiración (VESDA) en ambiente y bajo piso técnico, con agente limpio (Novec 1230 o FM-200).`,
      'step-10': `Iluminación: Luminarias LED herméticas sobre pasillos garantizando 500 lux a nivel de plano de trabajo.`,
      'step-11': `Videovigilancia: Cobertura completa de pasillos fríos/calientes con retención de 90 días y control biométrico.`,
      'step-12': `Monitoreo Zabbix: Sensores de temperatura/humedad por rack (frente/dorso), fuga de agua bajo piso y monitoreo SNMP de UPS y PDUs.`,
    },
  };
}

function extractFindings(text: string, parsed: any = {}) {
  const lower = text.toLowerCase();
  const rackMatch = lower.match(/(\d+)\s*(?:racks?|gabinetes?)/);
  const kwMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kw|kilos?)/);
  const upsMinMatch = lower.match(/(\d+)\s*(?:minutos?|mins?|min)\s*(?:de\s*)?(?:autonom[ií]a|respaldo|bater[ií]a)/);

  const racks = parsed.expectedRacks || (rackMatch ? parseInt(rackMatch[1]!, 10) : 4);
  const kw = parsed.expectedKwPerRack || (kwMatch ? parseFloat(kwMatch[1]!) : 5.0);
  const totalKw = (racks * kw).toFixed(1);
  const btu = Math.round(Number(totalKw) * 3412 * 1.3);
  const tons = (btu / 12000).toFixed(1);
  const autonomy = upsMinMatch ? upsMinMatch[1] : (lower.includes('15') ? '15' : '15');
  const hasDualFeed = lower.includes('doble acometida') || lower.includes('redundante') || lower.includes('a/b');
  const hasNPlusOne = lower.includes('n+1') || lower.includes('redundancia') || lower.includes('redundante');

  const findings = {
    racksSummary: `Se determinó una capacidad inicial para ${racks} gabinetes IT (42U estándar).`,
    powerSummary: `Carga crítica IT neta de ${totalKw} kW a ${kw} kW/rack. Con PUE 1.6 demanda aprox. ${(Number(totalKw) * 1.6).toFixed(1)} kW totales.`,
    upsSummary: `Sistema UPS en topología Online Doble Conversión con autonomía de ${autonomy} minutos en banco de baterías.`,
    coolingSummary: `Carga térmica de ${btu.toLocaleString()} BTU/h (~${tons} TR). Se requiere esquema ${hasNPlusOne ? 'redundante N+1' : 'N+1'} de precisión.`,
    civilSummary: `Sala de cómputo con al menos ${(racks * 5.5).toFixed(0)} m² libres, piso técnico elevado de 30 cm y carga en losa ≥ 12 kPa.`,
    electricalSummary: `Alimentación eléctrica ${hasDualFeed ? 'con doble acometida y ramales A/B redundantes' : 'con distribución A/B por rack (110V/220V)'} y ATS.`,
    fireSummary: `Detección temprana por aspiración (VESDA) y extinción mediante agente limpio gaseoso certificado NFPA 2001.`,
  };

  const recs = parsed.stepRecommendations || {};
  const completedRecs: Record<string, string> = {
    'step-02': recs['step-02'] || `Edificación y Obra Civil: El cliente requiere albergar ${racks} racks. Dimensionar sala de al menos ${(racks * 5.5).toFixed(0)} m² útiles, losa con resistencia de carga ≥ 12 kPa, piso técnico de 30 cm y puerta hermética de acceso ≥ 1.0m x 2.13m según TIA-942.`,
    'step-03': recs['step-03'] || `Planeamiento de Espacio y Racks: El requerimiento del cliente solicita ${racks} racks con densidad de ${kw} kW/rack. En esta fase debe distribuir exactamente ${racks} gabinetes con pasillo frontal ≥ 1.2m, posterior ≥ 1.0m y contención térmica de pasillo.`,
    'step-04': recs['step-04'] || `Carga Eléctrica IT: La demanda neta identificada es de ${totalKw} kW IT. Distribuir la potencia por rack a ${kw} kW con factor de simultaneidad 0.8 y prever crecimiento a 5 años.`,
    'step-05': recs['step-05'] || `Climatización: Se requiere disipar ${btu.toLocaleString()} BTU/h (~${tons} TR). En esta fase seleccione unidades de precisión perimetral bajo esquema N+1 con bandejas de condensado bajo piso técnico.`,
    'step-06': recs['step-06'] || `Alimentación Eléctrica por Rack: Instalar doble barra PDU (Línea A y Línea B independientes) por cada uno de los ${racks} racks, proveyendo tomas 110V y 220V grado servidor según lo requerido.`,
    'step-07': recs['step-07'] || `Tableros y Acometida: Diseñar tablero general con bypass de mantenimiento, conmutación automática ATS para doble acometida y barras de puesta a tierra TMGB.`,
    'step-08': recs['step-08'] || `Sistema UPS y Baterías: El cliente solicitó respaldo ininterrumpido. En esta fase dimensione la UPS en al menos ${Math.ceil(Number(totalKw) * 1.6 / 0.8)} kVA con autonomía garantizada de ${autonomy} minutos en baterías VRLA/Litio.`,
    'step-09': recs['step-09'] || `Extinción de Incendios: Implementar sistema de detección por aspiración de alta sensibilidad (VESDA) y descarga de agente limpio (Novec 1230 o FM-200) sin residuo conductor.`,
    'step-10': recs['step-10'] || `Iluminación: Luminarias LED sobre pasillos garantizando 500 lux a 1.0 m de altura con circuito de emergencia respaldado por UPS.`,
    'step-11': recs['step-11'] || `Videovigilancia y Accesos: Cobertura total de pasillos fríos/calientes con cámaras IP, almacenamiento de 90 días y control de acceso biométrico con esclusa.`,
    'step-12': recs['step-12'] || `Monitoreo Zabbix y DCIM: Sensores ambientales de temperatura y humedad en el frente y parte posterior de cada rack, sensor de fuga de agua bajo piso y monitoreo SNMP de UPS y PDUs.`,
  };

  return { racks, kw, totalKw, findings, completedRecs };
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
  ],
  "stepRecommendations": {
    "step-02": "Recomendación específica de obra civil, área m2 y piso técnico",
    "step-03": "Recomendación de distribución de racks, gálibos y pasillos",
    "step-04": "Criterio de carga eléctrica IT y simultaneidad",
    "step-05": "Criterio de climatización en BTU/TR y redundancia N+1",
    "step-06": "Criterio de tomas y redundancia A/B por rack",
    "step-07": "Criterio de acometida, tableros y unifilares",
    "step-08": "Criterio de capacidad de UPS y autonomía",
    "step-09": "Criterio de detección y extinción de incendios",
    "step-10": "Criterio de iluminación",
    "step-11": "Criterio de videovigilancia y control de acceso",
    "step-12": "Criterio de monitoreo Zabbix y sensores"
  }
}`;

  try {
    const raw = await generateAiCompletion(prompt);
    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    const { racks, kw, findings, completedRecs } = extractFindings(text, parsed);
    parsed.expectedRacks = parsed.expectedRacks || racks;
    parsed.expectedKwPerRack = parsed.expectedKwPerRack || kw;
    parsed.findings = findings;
    parsed.stepRecommendations = completedRecs;

    res.json({ success: true, analysis: parsed });
  } catch (err: any) {
    console.warn(`[AI Engine] Usando análisis heurístico: ${err.message}`);
    const fb = fallbackAnalysis(text);
    const { findings, completedRecs } = extractFindings(text, fb);
    fb.findings = findings;
    fb.stepRecommendations = completedRecs;

    res.json({
      success: true,
      analysis: fb,
      notice: `Preanálisis procesado mediante motor de ingeniería de contingencia.`,
    });
  }
});
