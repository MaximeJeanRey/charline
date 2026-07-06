import { CONFIG } from "../config";
import { joursAvantProchainePousse } from "../lib/temps";

interface Props {
  jours: number;
}

/**
 * Message d'ambiance discret, en bas de l'écran :
 *   - le jour actuel de l'arbre (en grand, manuscrit) ;
 *   - le nombre de jours avant la prochaine pousse (en petit, dessous).
 */
export function Ambiance({ jours }: Props) {
  if (!CONFIG.AFFICHER_AGE) return null;

  const texteJour = jours <= 1 ? "premier jour" : `${jours}e jour`;

  const restant = joursAvantProchainePousse(jours, CONFIG.TOTAL_ETAPES);
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
      <p id="jour-actuel">{texteJour}</p>
      <p id="prochaine-pousse">{textePousse}</p>
    </div>
  );
}
