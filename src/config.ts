/**
 * Configuration de l'expérience.
 * Modifie librement les valeurs ci-dessous — rien d'autre à toucher.
 */
export const CONFIG = {
  /** Jour zéro de l'arbre, au format AAAA-MM-JJ. */
  DATE_DEBUT: "2026-03-11",

  /** Nombre total d'étapes de croissance (une par jour, un peu plus de 14 mois). */
  TOTAL_ETAPES: 446,

  /** Dossier contenant les illustrations de l'arbre (dans /public). */
  DOSSIER_ARBRE: "imgs",

  /**
   * Numéros des jours pour lesquels une illustration existe, sous la
   * forme <numéro>.png dans DOSSIER_ARBRE (ex. imgs/1.png, imgs/446.png).
   * Chaque jour sans image affiche l'illustration disponible la plus
   * proche.
   *
   * Générée pour couvrir les jours 1 à 446 en continu (une image par
   * jour, tant que TOTAL_ETAPES reste à 446). Si certains jours n'ont
   * en réalité pas d'image (trou dans la série), retire-les de la liste
   * — sinon le site tentera de charger un fichier qui n'existe pas.
   */
  STAGES_IMAGES: Array.from({ length: 446 }, (_, i) => i + 1),

  /** Dossier contenant winter.jpg, spring.jpg, summer.jpg, autumn.jpg (dans /public). */
  DOSSIER_FONDS: "assets/backgrounds",

  /** Afficher ou non le message d'ambiance (jour actuel + prochaine pousse). */
  AFFICHER_AGE: true,
} as const;
