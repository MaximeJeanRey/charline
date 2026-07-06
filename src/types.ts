export type Saison = "hiver" | "printemps" | "ete" | "automne";

/** Nom de fichier anglais attendu dans /public/assets/backgrounds, par saison. */
export const NOM_FICHIER_SAISON: Record<Saison, string> = {
  hiver: "winter",
  printemps: "spring",
  ete: "summer",
  automne: "autumn",
};
