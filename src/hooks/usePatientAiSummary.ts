import { useCallback, useEffect, useRef, useState } from "react";
import type { PatientAiSummary } from "../data/patientAiSummaries";
import {
  getPatientAiSummary,
  mergeOllamaSummary,
} from "../data/patientAiSummaries";
import { generatePatientSummaryWithOllama, isOllamaAvailable } from "../services/ollama";
import type { Patient, PatientHistory } from "../types";
import { buildPatientChartContext } from "../utils/patientChartContext";

const ollamaCache = new Map<string, PatientAiSummary>();

export type AiSummaryState = {
  summary: PatientAiSummary | null;
  loading: boolean;
  ollamaAvailable: boolean;
  error: string | null;
  /** Trigger Ollama manually — avoids GPU load on every patient switch. */
  enhanceWithOllama: () => void;
};

export function usePatientAiSummary(
  patient: Patient | undefined,
  getHistory: (id: string) => PatientHistory | null
): AiSummaryState {
  const [summary, setSummary] = useState<PatientAiSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [ollamaAvailable, setOllamaAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  // Invalidate requests on patient changes/unmount, not on each monitor tick.
  useEffect(() => {
    requestIdRef.current += 1;
    setLoading(false);
    setError(null);
    return () => { requestIdRef.current += 1; };
  }, [patient?.id]);

  // Instant chart-based summary — no GPU
  useEffect(() => {
    if (!patient) {
      setSummary(null);
      setError(null);
      return;
    }

    const history = getHistory(patient.id);
    const cached = ollamaCache.get(patient.id);
    setSummary(cached ?? getPatientAiSummary(patient, history));
  }, [patient, getHistory]);

  // Check Ollama availability once (lightweight ping)
  useEffect(() => {
    isOllamaAvailable().then(setOllamaAvailable);
  }, []);

  const enhanceWithOllama = useCallback(() => {
    if (!patient || loading) return;

    const history = getHistory(patient.id);
    const fallback = getPatientAiSummary(patient, history);
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    async function run() {
      const available = await isOllamaAvailable();
      if (requestId !== requestIdRef.current) return;

      if (!available) {
        setOllamaAvailable(false);
        setSummary(fallback);
        setLoading(false);
        setError("Ollama not running — showing chart summary");
        return;
      }

      setOllamaAvailable(true);

      try {
        const chartContext = buildPatientChartContext(patient!, history);
        const ollamaPayload = await generatePatientSummaryWithOllama(
          chartContext,
          patient!.gravida === 1
        );

        if (requestId !== requestIdRef.current) return;

        const now = new Date().toLocaleString([], {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const merged = mergeOllamaSummary(
          { ...fallback, generatedAt: now },
          ollamaPayload
        );

        ollamaCache.set(patient!.id, merged);
        setSummary(merged);
        setError(null);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        const message = err instanceof Error ? err.message : "Ollama failed";
        setSummary(fallback);
        setError(`${message} — chart summary shown`);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }

    run();
  }, [patient, getHistory, loading]);

  const liveFallback = patient ? getPatientAiSummary(patient, getHistory(patient.id)) : null;
  const currentSummary = liveFallback && summary?.patientId === patient?.id && summary?.source === "ollama"
    ? { ...summary, ctgStatus: liveFallback.ctgStatus }
    : liveFallback;
  return { summary: currentSummary, loading, ollamaAvailable, error, enhanceWithOllama };
}
