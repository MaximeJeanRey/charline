import { useEffect, useState } from "react";
import { CONFIG } from "../config";

/** 52 secondes pour représenter les 52 semaines (une par seconde). */
const DUREE_SECONDES = 52;
const JOURS_TOTAUX = CONFIG.TOTAL_ETAPES * 7;

/**
 * Détecte le mode "aperçu accéléré" via `?apercu` dans l'URL.
 * Volontairement caché derrière un paramètre plutôt qu'un bouton : la vraie
 * expérience ne doit avoir aucune navigation visible.
 */
export function useApercuAccelereActif(): boolean {
  const [actif] = useState(
    () => new URLSearchParams(window.location.search).has("apercu"),
  );
  return actif;
}

/**
 * Simule le passage des 52 semaines (et donc des 4 saisons) en boucle sur
 * DUREE_SECONDES, en réutilisant telles quelles les fonctions de calcul de
 * src/lib/temps.ts (elles ne voient qu'une Date, réelle ou simulée).
 */
export function useHorlogeAcceleree(actif: boolean): Date | null {
  const [dateSimulee, setDateSimulee] = useState<Date | null>(null);

  useEffect(() => {
    if (!actif) return;

    const debutMs = new Date(CONFIG.DATE_DEBUT + "T00:00:00").getTime();
    const debutChrono = performance.now();

    function tick() {
      const ecouleSecondes = ((performance.now() - debutChrono) / 1000) % DUREE_SECONDES;
      const joursSimules = (ecouleSecondes / DUREE_SECONDES) * JOURS_TOTAUX;
      setDateSimulee(new Date(debutMs + joursSimules * 24 * 60 * 60 * 1000));
    }

    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [actif]);

  return dateSimulee;
}
