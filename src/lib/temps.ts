import type { Saison } from "../types";

/** Nombre de jours pleins écoulés depuis la date de départ (jamais négatif). */
export function joursEcoules(dateDebut: string, maintenant: Date): number {
  const debut = new Date(dateDebut + "T00:00:00");
  const msParJour = 24 * 60 * 60 * 1000;
  const diff = Math.floor(
    (Date.UTC(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate()) -
      Date.UTC(debut.getFullYear(), debut.getMonth(), debut.getDate())) /
      msParJour,
  );
  return Math.max(0, diff);
}

/** Étape de croissance actuelle (1 à totalEtapes), une par jour écoulé. */
export function etapeActuelle(jours: number, totalEtapes: number): number {
  return Math.max(1, Math.min(totalEtapes, jours + 1));
}

/** Jours écoulés en valeur continue (fractions de jour comprises). */
export function joursEcoulesContinus(dateDebut: string, maintenant: Date): number {
  const debut = new Date(dateDebut + "T00:00:00").getTime();
  return Math.max(0, (maintenant.getTime() - debut) / (24 * 60 * 60 * 1000));
}

/**
 * Étape fractionnaire, pour l'aperçu accéléré : au lieu d'avancer par
 * paliers d'un jour, l'arbre grandit continûment, comme une animation.
 */
export function etapeContinue(jours: number, totalEtapes: number): number {
  return Math.min(totalEtapes, jours);
}

/**
 * Nombre de jours avant la prochaine pousse (le prochain palier journalier
 * de croissance — toujours 1, puisque l'étape avance chaque jour). Renvoie
 * `null` quand l'arbre a atteint son dernier stade : il n'y a alors plus de
 * pousse à venir.
 */
export function joursAvantProchainePousse(jours: number, totalEtapes: number): number | null {
  if (etapeActuelle(jours, totalEtapes) >= totalEtapes) return null;
  return 1;
}

/** Saison météorologique (hémisphère nord) pour une date donnée. */
export function saisonActuelle(date: Date): Saison {
  const mois = date.getMonth(); // 0 = janvier
  if (mois === 11 || mois === 0 || mois === 1) return "hiver";
  if (mois >= 2 && mois <= 4) return "printemps";
  if (mois >= 5 && mois <= 7) return "ete";
  return "automne";
}
