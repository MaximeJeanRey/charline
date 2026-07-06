import { CONFIG } from "../config";
import { useImageExiste } from "./useImageExiste";

/**
 * Vérifie UNE SEULE FOIS (via la première illustration disponible) si de
 * vraies images ont été déposées dans DOSSIER_ARBRE : soit elles y sont,
 * soit on bascule sur l'arbre dessiné. Refaire ce test à chaque changement
 * d'étape ferait clignoter l'arbre à chaque semaine (très visible en mode
 * aperçu accéléré, où les étapes changent toutes les secondes).
 *
 * Retourne `null` tant que la vérification est en cours.
 */
export function useIllustrationsArbreDisponibles(): boolean | null {
  const premierStade = CONFIG.STAGES_IMAGES[0];
  const url = `${import.meta.env.BASE_URL}${CONFIG.DOSSIER_ARBRE}/${premierStade}.png`;
  const etat = useImageExiste(url);
  if (etat === "chargement") return null;
  return etat === "disponible";
}
