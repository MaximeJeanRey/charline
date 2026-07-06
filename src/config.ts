/**
 * Configuration de l'expérience.
 * Modifie librement les valeurs ci-dessous — rien d'autre à toucher.
 */
export const CONFIG = {
  /** Jour zéro de l'arbre, au format AAAA-MM-JJ. */
  DATE_DEBUT: "2026-07-06",

  /** Nombre total d'étapes de croissance (une image par semaine). */
  TOTAL_ETAPES: 52,

  /** Dossier contenant les illustrations de l'arbre (dans /public). */
  DOSSIER_ARBRE: "imgs",

  /**
   * Numéros des semaines pour lesquelles une illustration existe, sous la
   * forme <numéro>.png dans DOSSIER_ARBRE (ex. imgs/1.png, imgs/52.png).
   * Chaque semaine sans image affiche l'illustration disponible la plus
   * proche. Ajoute simplement d'autres numéros ici (et le PNG correspondant)
   * pour affiner la croissance — 10, 11, ... jusqu'à 51.
   */
  STAGES_IMAGES: [1, 2, 3, 4, 5, 6, 7, 8, 9, 52],

  /** Dossier contenant winter.jpg, spring.jpg, summer.jpg, autumn.jpg (dans /public). */
  DOSSIER_FONDS: "assets/backgrounds",

  /** Afficher ou non le message d'ambiance (jour actuel + prochaine pousse). */
  AFFICHER_AGE: true,
} as const;
