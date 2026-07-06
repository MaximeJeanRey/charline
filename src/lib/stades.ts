/**
 * Choisit, pour une étape donnée (1..totalEtapes, éventuellement
 * fractionnaire en aperçu accéléré), le numéro d'illustration disponible
 * le plus proche parmi `stagesDisponibles`.
 *
 * Ex. avec [1..9, 52] : semaine 7 -> 7, semaine 20 -> 9, semaine 40 -> 52.
 * En cas d'égalité de distance, on garde le plus petit (l'arbre grandit
 * un peu plus tard plutôt qu'un peu plus tôt).
 */
export function stadeLePlusProche(etape: number, stagesDisponibles: readonly number[]): number {
  let meilleur = stagesDisponibles[0];
  let meilleureDistance = Infinity;
  for (const stade of stagesDisponibles) {
    const d = Math.abs(stade - etape);
    if (d < meilleureDistance) {
      meilleureDistance = d;
      meilleur = stade;
    }
  }
  return meilleur;
}
