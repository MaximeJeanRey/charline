import { useCallback, useEffect, useState } from "react";

/**
 * Permet de consulter les jours précédents de l'arbre, sans jamais pouvoir
 * dépasser aujourd'hui : le futur reste cadré hors de portée.
 *
 * On stocke un décalage (nombre de jours en arrière par rapport à
 * `joursReels`) plutôt qu'un jour absolu : si la page reste ouverte après
 * minuit pendant qu'on regarde "il y a 3 jours", ça reste "il y a 3 jours"
 * au lieu de se figer sur une date qui devient incohérente.
 *
 * Navigation au clic (flèches) ou au clavier (← →).
 */
export function useNavigationJours(joursReels: number) {
  const [decalage, setDecalage] = useState(0);

  const reculer = useCallback(() => {
    setDecalage((d) => Math.min(joursReels, d + 1));
  }, [joursReels]);

  const avancer = useCallback(() => {
    setDecalage((d) => Math.max(0, d - 1));
  }, []);

  const revenirAujourdhui = useCallback(() => setDecalage(0), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") reculer();
      else if (e.key === "ArrowRight") avancer();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reculer, avancer]);

  const jour = Math.max(0, joursReels - decalage);

  return {
    jour,
    enHistorique: decalage > 0,
    peutReculer: jour > 0,
    peutAvancer: decalage > 0,
    reculer,
    avancer,
    revenirAujourdhui,
  };
}
