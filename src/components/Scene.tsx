import { useMemo } from "react";
import { CONFIG } from "../config";
import { useHorloge } from "../hooks/useHorloge";
import { useApercuAccelereActif, useHorlogeAcceleree } from "../hooks/useApercuAccelere";
import { joursEcoules, joursEcoulesContinus, etapeActuelle, etapeContinue, saisonActuelle } from "../lib/temps";
import { FondSaison } from "./FondSaison";
import { Arbre } from "./Arbre";
import { CanevasMeteo } from "./CanevasMeteo";
import { Ambiance } from "./Ambiance";

/**
 * Scène plein écran : aucun écran d'accueil, aucune navigation.
 * Tout est calculé à partir de la date du jour et affiché immédiatement.
 *
 * Mode "aperçu accéléré" (`?apercu` dans l'URL) : les 52 semaines et les 4
 * saisons défilent en boucle sur 52 secondes, pour visualiser rapidement
 * l'ensemble de la croissance sans attendre un an. Caché derrière un
 * paramètre d'URL plutôt qu'un bouton, pour que la vraie expérience reste
 * sans aucune navigation visible.
 */
export function Scene() {
  const apercuActif = useApercuAccelereActif();
  const maintenantReel = useHorloge();
  const dateSimulee = useHorlogeAcceleree(apercuActif);
  const maintenant = apercuActif && dateSimulee ? dateSimulee : maintenantReel;

  const { jours, etape, saison } = useMemo(() => {
    const jours = joursEcoules(CONFIG.DATE_DEBUT, maintenant);
    // En aperçu accéléré, l'étape est fractionnaire : l'arbre grandit
    // continûment au lieu de sauter d'une semaine à l'autre.
    const etape = apercuActif
      ? etapeContinue(joursEcoulesContinus(CONFIG.DATE_DEBUT, maintenant), CONFIG.TOTAL_ETAPES)
      : etapeActuelle(jours, CONFIG.TOTAL_ETAPES);
    return { jours, etape, saison: saisonActuelle(maintenant) };
  }, [maintenant, apercuActif]);

  return (
    <main id="scene" className={apercuActif ? "apercu-accelere" : ""}>
      <FondSaison saison={saison} />
      <div id="paper-grain" />
      <div id="vignette" />
      <CanevasMeteo saison={saison} />
      <Arbre etape={etape} saison={saison} />
      <Ambiance jours={jours} />
      {apercuActif && <p id="apercu-etiquette">aperçu accéléré · 52 s = 52 semaines</p>}
    </main>
  );
}
