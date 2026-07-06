import { CONFIG } from "../config";

interface Props {
  jours: number;
}

export function Ambiance({ jours }: Props) {
  const texteAge = jours <= 1 ? "premier jour" : `${jours}e jour`;

  return (
    <div id="ambiance" className="visible">
      <p id="phrase-poetique">{CONFIG.PHRASE_POETIQUE}</p>
      {CONFIG.AFFICHER_AGE && <p id="age-jours">{texteAge}</p>}
    </div>
  );
}
