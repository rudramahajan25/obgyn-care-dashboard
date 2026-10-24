import { Loader2, Maximize2, RotateCcw, ZoomIn } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type DwvApp = import("dwv").App;

interface DicomViewerProps {
  url: string;
  label?: string;
  height?: number;
  className?: string;
  onOpenFullscreen?: () => void;
}

export function DicomViewer({
  url,
  label,
  height = 320,
  className = "",
  onOpenFullscreen,
}: DicomViewerProps) {
  const reactId = useId().replace(/:/g, "");
  const layerDivId = `dwv-layer-${reactId}`;
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<DwvApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function mount() {
      try {
        const { App, AppOptions, ViewConfig } = await import("dwv");
        if (cancelled || !hostRef.current) return;

        appRef.current?.abortAllLoads();
        appRef.current?.reset();
        appRef.current = null;

        hostRef.current.innerHTML = "";
        const layer = document.createElement("div");
        layer.id = layerDivId;
        layer.style.width = "100%";
        layer.style.height = "100%";
        layer.style.background = "#000";
        hostRef.current.appendChild(layer);

        const viewConfig = new ViewConfig(layerDivId);
        const options = new AppOptions({ "*": [viewConfig] });
        const app = new App();
        appRef.current = app;

        const onLoaded = () => {
          if (!cancelled) setLoading(false);
        };
        const onFailed = () => {
          if (!cancelled) {
            setError("Could not load DICOM");
            setLoading(false);
          }
        };

        app.addEventListener("loadend", onLoaded);
        app.addEventListener("error", onFailed);

        app.init(options);
        app.loadURLs([url]);
      } catch {
        if (!cancelled) {
          setError("DICOM viewer failed to start");
          setLoading(false);
        }
      }
    }

    mount();

    return () => {
      cancelled = true;
      appRef.current?.abortAllLoads();
      appRef.current?.reset();
      appRef.current = null;
      if (hostRef.current) hostRef.current.innerHTML = "";
    };
  }, [url, layerDivId]);

  const resetView = () => {
    appRef.current?.resetZoomPan();
    appRef.current?.resetViews();
  };

  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-black ${className}`}>
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-300">
        <span>
          {label ?? "DICOM"} · <span className="text-slate-500">DWV</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Reset view"
            onClick={resetView}
            className="rounded p-1 hover:bg-white/10"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          {onOpenFullscreen && (
            <button
              type="button"
              title="Fullscreen"
              onClick={onOpenFullscreen}
              className="rounded p-1 hover:bg-white/10"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="relative" style={{ height }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/80 text-slate-300">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-xs">Loading DICOM…</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black p-4 text-center text-xs text-red-300">
            {error}
          </div>
        )}
        <div ref={hostRef} className="h-full w-full" />
      </div>

      <p className="flex items-center gap-1 border-t border-white/10 bg-slate-900 px-3 py-1.5 text-[10px] text-slate-500">
        <ZoomIn className="h-3 w-3" />
        Drag to pan · scroll to zoom · right-drag window/level
      </p>
    </div>
  );
}
