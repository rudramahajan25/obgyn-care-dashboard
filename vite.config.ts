import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/obgyn-care-dashboard/",
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ["dwv"],
  },
});
