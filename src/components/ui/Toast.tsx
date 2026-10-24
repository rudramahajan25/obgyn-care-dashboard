import { useApp } from "../../context/AppContext";

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">
      {toast}
    </div>
  );
}
