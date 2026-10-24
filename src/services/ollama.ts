import type { PatientAiSummary } from "../data/patientAiSummaries";

const OLLAMA_BASE_URL = "http://localhost:11434";
const DEFAULT_MODEL = "qwen3.5:9b";
const REQUEST_TIMEOUT_MS = 60_000;

export type OllamaSummaryPayload = Omit<
  PatientAiSummary,
  "patientId" | "generatedAt" | "source"
>;

/**
 * System prompt — role + rules + schema.
 * Field order matches clinical handover sequence.
 */
const SYSTEM_PROMPT = `You are an obstetric LR handover assistant. Output ONLY valid JSON matching the schema below. No markdown, no explanation, no extra keys.

RULES:
- NEVER repeat info across fields. Each fact appears ONCE in the most relevant field.
- Aim for 250–350 words; retain clinically relevant values, units and report dates.
- Use only supplied chart facts. Do not invent diagnoses, CTG categories, consent completion, observations, drug indications or new treatment orders.
- Current monitor readings are NOT admission observations. Never assert stability from missing data.
- Current vitals and consent reminders are displayed directly from the chart by the application; do not duplicate them in the narrative.
- Missing information must be described as not recorded, never normal. Do not infer fetal tachycardia or a CTG category from an isolated FHR.
- Skip routine/normal antenatal visits entirely.
- Do NOT put G/P, blood group, or allergies in any field (already in header).
- Do NOT duplicate medication names in antenatalSummary.

FIELD ORDER (clinical handover sequence):
{
  "conditionHighlight": "short phrase ONLY if critical/elevated, else empty string",
  "antenatalSummary": "brief antenatal details — abnormal/high-risk only, 1-2 lines",
  "admissionHistory": "documented admission history and GA; say not recorded when admission observations are unavailable",
  "admissionPvFindings": "P/V findings verbatim from chart",
  "pelvisAssessment": "pelvis findings ONLY if primigravida, else empty string",
  "recentLabFindings": "significant recent lab results with values",
  "recentUsgFindings": "latest USG measurements and scan summary",
  "ctgStatus": "recorded FHR and CTG features only; do not infer accelerations or assign a category",
  "ongoingTreatment": ["documented medication, dose and indication only when supplied"],
  "riskFactors": ["max 4"],
  "immediatePlan": ["documented plan or requests for clinician review; no invented orders"]
}`;

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function generatePatientSummaryWithOllama(
  chartContext: string,
  isPrimigravida: boolean
): Promise<Partial<OllamaSummaryPayload>> {
  const userPrompt = isPrimigravida
    ? `Patient is PRIMIGRAVIDA — include pelvisAssessment.\n\nChart:\n${chartContext}`
    : `Patient is NOT primigravida — set pelvisAssessment to empty string.\n\nChart:\n${chartContext}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: false,
        format: "json",
        options: {
          temperature: 0.15,
          num_predict: 1000,
          num_ctx: 4096,
          top_p: 0.9,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);

    const data = (await res.json()) as { message?: { content?: string } };
    const raw = data.message?.content?.trim();
    if (!raw) throw new Error("Empty Ollama response");

    return normalizeOllamaPayload(
      JSON.parse(raw) as Partial<OllamaSummaryPayload>
    );
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeOllamaPayload(
  raw: Partial<OllamaSummaryPayload>
): Partial<OllamaSummaryPayload> {
  const toStringArray = (val: unknown): string[] => {
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === "string" && val.trim()) return [val];
    return [];
  };

  return {
    conditionHighlight: raw.conditionHighlight || undefined,
    antenatalSummary: raw.antenatalSummary,
    admissionHistory: raw.admissionHistory,
    admissionPvFindings: raw.admissionPvFindings,
    pelvisAssessment: raw.pelvisAssessment || undefined,
    recentLabFindings: raw.recentLabFindings,
    recentUsgFindings: raw.recentUsgFindings,
    ctgStatus: raw.ctgStatus,
    ongoingTreatment: toStringArray(raw.ongoingTreatment),
    riskFactors: toStringArray(raw.riskFactors),
    immediatePlan: toStringArray(raw.immediatePlan),
  };
}
