import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { CONFIG } from "../config";
import type { Saison } from "../types";
import { useIllustrationsArbreDisponibles } from "../hooks/useIllustrationsArbre";
import { useImageDetouree } from "../hooks/useImageDetouree";
import { stadeLePlusProche } from "../lib/stades";
import { genererArbreSVG } from "../lib/watercolorTree";

interface Props {
  etape: number;
  saison: Saison;
}

/**
 * Affiche l'arbre : les illustrations aquarelle déposées dans
 * DOSSIER_ARBRE (imgs/1.png ... imgs/52.png) si elles sont présentes,
 * sinon un arbre dessiné en SVG (secours).
 *
 * Chaque semaine choisit l'illustration disponible la plus proche, et le
 * passage d'un stade au suivant se fait en fondu enchaîné (deux calques
 * d'images superposés) : même un grand saut de croissance devient une
 * lente dissolution plutôt qu'un à-coup.
 *
 * Les illustrations ont un fond blanc : `mix-blend-mode: multiply` (en CSS)
 * fait fondre ce blanc dans le papier, si bien que la teinte de la saison
 * traverse l'illustration comme une lumière — l'arbre paraît peint sur la
 * scène plutôt que collé dessus.
 */
export function Arbre({ etape, saison }: Props) {
  // Vérifié une seule fois (pas à chaque étape, sinon l'arbre clignoterait).
  const illustrationsDisponibles = useIllustrationsArbreDisponibles();

  const urlStade = useMemo(() => {
    const stade = stadeLePlusProche(etape, CONFIG.STAGES_IMAGES);
    return `${import.meta.env.BASE_URL}${CONFIG.DOSSIER_ARBRE}/${stade}.png`;
  }, [etape]);

  // Illustration avec fond blanc retiré (transparent), pour qu'elle repose
  // directement sur la scène. `null` tant que le détourage est en cours.
  const urlDetouree = useImageDetouree(urlStade);

  // Fondu enchaîné entre deux calques d'images (même principe que les fonds
  // de saison) : à chaque changement de stade, on peint la nouvelle image
  // sur le calque inactif puis on inverse les opacités.
  const [calques, setCalques] = useState<[string | null, string | null]>([null, null]);
  const [actif, setActif] = useState<0 | 1>(0);
  const actifRef = useRef<0 | 1>(0);

  useEffect(() => {
    if (illustrationsDisponibles !== true || !urlDetouree) return;
    setCalques((prec) => {
      if (prec[actifRef.current] === urlDetouree) return prec; // déjà affichée
      const cible: 0 | 1 = actifRef.current === 0 ? 1 : 0;
      const suivant: [string | null, string | null] = [...prec];
      suivant[cible] = urlDetouree;
      actifRef.current = cible;
      setActif(cible);
      return suivant;
    });
  }, [urlDetouree, illustrationsDisponibles]);

  // Fondu d'apparition global, une fois qu'on sait quoi afficher.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (illustrationsDisponibles === null) return;
    setVisible(true);
  }, [illustrationsDisponibles]);

  const svgSecours = useMemo(
    () => genererArbreSVG(etape, CONFIG.TOTAL_ETAPES, saison),
    [etape, saison],
  );

  function styleImg(url: string | null, estActif: boolean): CSSProperties {
    return { backgroundImage: url ? `url("${url}")` : undefined, opacity: url && estActif ? 1 : 0 };
  }

  return (
    <div id="tree-wrap" className={visible ? "entree" : ""}>
      {illustrationsDisponibles === true ? (
        <div id="tree-photo" role="img" aria-label={`l'arbre, semaine ${Math.round(etape)}`}>
          <div className="tree-photo-layer" style={styleImg(calques[0], actif === 0)} />
          <div className="tree-photo-layer" style={styleImg(calques[1], actif === 1)} />
        </div>
      ) : illustrationsDisponibles === false ? (
        <div id="tree-fallback" className="actif" dangerouslySetInnerHTML={{ __html: svgSecours }} />
      ) : null}
    </div>
  );
}
