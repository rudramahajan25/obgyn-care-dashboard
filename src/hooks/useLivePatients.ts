import { useEffect, useRef, useState } from "react";
import { patients as initialPatients } from "../data/mockData";
import type { Patient } from "../types";
import { formatLastUpdate, tickAllPatients } from "../utils/liveVitals";

const LIVE_INTERVAL_MS = 2800;

export function useLivePatients(enabled: boolean) {
  const [patients, setPatients] = useState<Patient[]>(() =>
    structuredClone(initialPatients)
  );
  const tickRef = useRef(0);
  const lastTickAtRef = useRef(Date.now());
  const [liveRevision, setLiveRevision] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setPatients(structuredClone(initialPatients));
      return;
    }

    const id = window.setInterval(() => {
      tickRef.current += 1;
      lastTickAtRef.current = Date.now();
      setPatients((prev) => tickAllPatients(prev, tickRef.current));
      setLiveRevision((t) => t + 1);
    }, LIVE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const id = window.setInterval(() => {
      const secondsAgo = Math.floor((Date.now() - lastTickAtRef.current) / 1000);
      if (secondsAgo < 5) return;

      setPatients((prev) =>
        prev.map((p) => ({
          ...p,
          lastUpdate: formatLastUpdate(secondsAgo),
        }))
      );
    }, 1000);

    return () => window.clearInterval(id);
  }, [enabled]);

  return { patients, liveRevision };
}
