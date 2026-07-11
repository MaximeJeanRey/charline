import { CONFIG } from "../config";
import { joursAvantProchainePousse } from "../lib/temps";

interface Props {
  jour: number;
  enHistorique: boolean;
  peutReculer: boolean;
  peutAvancer: boolean;
  onReculer: () => void;
  onAvancer: () => void;
  onRevenirAujourdhui: () => void;
}

/**
 * Message d'ambiance discret, en bas de l'écran :
 *   - une flèche de chaque côté du jour actuel, pour feuilleter les jours
 *     précédents (jamais les suivants : le futur reste caché) ;
 *   - le jour actuel de l'arbre (en grand, manuscrit) ;
 *   - en dessous, le nombre de jours avant la prochaine pousse, ou — en
 *     navigation dans l'historique — un lien pour revenir à aujourd'hui.
 */
export function Ambiance({
  jour,
  enHistorique,
  peutReculer,
  peutAvancer,
  onReculer,
  onAvancer,
  onRevenirAujourdhui,
}: Props) {
  if (!CONFIG.AFFICHER_AGE) return null;

  const texteJour = jour <= 1 ? "premier jour" : `${jour}e jour`;

  const restant = joursAvantProchainePousse(jour, CONFIG.TOTAL_ETAPES);
  let textePousse: string;
  if (restant === null) {
    textePousse = "l'arbre a atteint sa pleine grandeur";
  } else if (restant <= 1) {
    textePousse = "prochaine pousse demain";
  } else {
    textePousse = `prochaine pousse dans ${restant} jours`;
  }

  return (
    <div id="ambiance" className="visible">
      <div id="jour-nav">
        <button
          type="button"
          className="fleche-jour"
          onClick={onReculer}
          disabled={!peutReculer}
          aria-label="Voir le jour précédent"
        >
          ‹
        </button>
        <p id="jour-actuel">{texteJour}</p>
        <button
          type="button"
          className="fleche-jour"
          onClick={onAvancer}
          disabled={!peutAvancer}
          aria-label="Voir le jour suivant"
        >
          ›
        </button>
      </div>
      {enHistorique ? (
        <button type="button" id="revenir-aujourdhui" onClick={onRevenirAujourdhui}>
          revenir à aujourd'hui
        </button>
      ) : (
        <p id="prochaine-pousse">{textePousse}</p>
      )}
    </div>
  );
}
