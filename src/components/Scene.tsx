import { useMemo } from "react";
import { CONFIG } from "../config";
import { useHorloge } from "../hooks/useHorloge";
import { useApercuAccelereActif, useHorlogeAcceleree, DUREE_SECONDES } from "../hooks/useApercuAccelere";
import { useNavigationJours } from "../hooks/useNavigationJours";
import { joursEcoules, joursEcoulesContinus, etapeActuelle, etapeContinue, saisonActuelle } from "../lib/temps";
import { FondSaison } from "./FondSaison";
import { Arbre } from "./Arbre";
import { CanevasMeteo } from "./CanevasMeteo";
import { Ambiance } from "./Ambiance";

const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

/**
 * Scène plein écran : aucun écran d'accueil, aucune navigation visible par
 * défaut. Tout est calculé à partir de la date du jour et affiché
 * immédiatement.
 *
 * Deux façons de sortir du présent, toutes deux impossibles à faire avancer
 * au-delà d'aujourd'hui :
 *   - navigation en jours précédents (flèches sous le jour actuel, ou ← →) ;
 *   - mode "aperçu accéléré" (`?apercu` dans l'URL), qui rejoue toute la
 *     croissance en boucle sur 52 secondes. Cache derrière un paramètre
 *     d'URL plutôt qu'un bouton, pour que la vraie expérience reste sans
 *     chrome superflu.
 */
export function Scene() {
  const apercuActif = useApercuAccelereActif();
  const maintenantReel = useHorloge();
  const dateSimulee = useHorlogeAcceleree(apercuActif);
  const maintenant = apercuActif && dateSimulee ? dateSimulee : maintenantReel;

  const joursReels = useMemo(
    () => joursEcoules(CONFIG.DATE_DEBUT, maintenantReel),
    [maintenantReel],
  );
  const navigation = useNavigationJours(joursReels);

  const { jours, etape, saison } = useMemo(() => {
    if (apercuActif) {
      const jours = joursEcoules(CONFIG.DATE_DEBUT, maintenant);
      // En aperçu accéléré, l'étape est fractionnaire : l'arbre grandit
      // continûment au lieu de sauter d'un jour à l'autre.
      const etape = etapeContinue(joursEcoulesContinus(CONFIG.DATE_DEBUT, maintenant), CONFIG.TOTAL_ETAPES);
      return { jours, etape, saison: saisonActuelle(maintenant) };
    }
    // Jour affiché : aujourd'hui, ou un jour précédent si on navigue dans
    // l'historique. La saison suit le jour affiché, pas le jour réel, pour
    // que la scène entière (arbre + fond) corresponde à ce moment-là.
    const jours = navigation.jour;
    const etape = etapeActuelle(jours, CONFIG.TOTAL_ETAPES);
    const dateAffichee = new Date(new Date(CONFIG.DATE_DEBUT + "T00:00:00").getTime() + jours * MS_PAR_JOUR);
    return { jours, etape, saison: saisonActuelle(dateAffichee) };
  }, [maintenant, apercuActif, navigation.jour]);

  return (
    <main id="scene" className={apercuActif ? "apercu-accelere" : ""}>
      <FondSaison saison={saison} />
      <div id="paper-grain" />
      <div id="vignette" />
      <CanevasMeteo saison={saison} />
      <Arbre etape={etape} saison={saison} />
      <Ambiance
        jour={jours}
        enHistorique={!apercuActif && navigation.enHistorique}
        peutReculer={!apercuActif && navigation.peutReculer}
        peutAvancer={!apercuActif && navigation.peutAvancer}
        onReculer={navigation.reculer}
        onAvancer={navigation.avancer}
        onRevenirAujourdhui={navigation.revenirAujourdhui}
      />
      {apercuActif && <p id="apercu-etiquette">aperçu accéléré · {DUREE_SECONDES} s = {CONFIG.TOTAL_ETAPES} jours</p>}
    </main>
  );
}
