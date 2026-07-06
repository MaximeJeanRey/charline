import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Chemin relatif : fonctionne tel quel sur GitHub Pages, quel que soit
  // le nom du dépôt (utilisateur.github.io/nom-du-repo/...).
  base: "./",
});
