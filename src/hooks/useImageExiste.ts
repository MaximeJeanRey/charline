import { useEffect, useState } from "react";

export type EtatImage = "chargement" | "disponible" | "absente";

/**
 * Vérifie si une image charge correctement à l'URL donnée.
 * Sert à savoir si on doit afficher la vraie illustration (PNG/JPG fournie
 * par l'utilisateur) ou basculer sur le rendu de secours généré.
 */
export function useImageExiste(url: string): EtatImage {
  const [etat, setEtat] = useState<EtatImage>("chargement");

  useEffect(() => {
    let annule = false;
    setEtat("chargement");

    const img = new Image();
    img.onload = () => {
      if (!annule) setEtat("disponible");
    };
    img.onerror = () => {
      if (!annule) setEtat("absente");
    };
    img.src = url;

    return () => {
      annule = true;
    };
  }, [url]);

  return etat;
}
