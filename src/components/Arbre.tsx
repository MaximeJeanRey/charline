import { useEffect, useMemo, useRef, useState } from "react";
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

/** Un peu plus que la durée de la transition CSS (2.4s) sur .tree-photo-layer. */
const DUREE_FONDU_MS = 2600;

/**
 * Affiche l'arbre : les illustrations aquarelle déposées dans
 * DOSSIER_ARBRE (imgs/1.png ... imgs/N.png) si elles sont présentes,
 * sinon un arbre dessiné en SVG (secours).
 *
 * Chaque jour choisit l'illustration disponible la plus proche. Les
 * calques sont empilés et identifiés par leur URL (clé React) : chaque
 * nouvelle image se monte par-dessus les précédentes et s'anime en fondu
 * d'apparition, puis les calques recouverts sont retirés une fois la
 * transition terminée. Cette pile clé-par-URL (plutôt qu'un index de
 * "calque actif" tenu à la main) évite tout désync possible entre
 * l'image affichée et l'étape demandée, y compris lors d'allers-retours
 * rapides dans la navigation en jours précédents.
 *
 * Les photos sont calées en hauteur sur l'écran (plein format portrait) :
 * leur largeur suit leur ratio d'origine et peut dépasser l'écran — on
 * glisse alors horizontalement pour en voir le reste. Chaque nouvelle
 * photo s'ouvre recentrée.
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

  // Pile de calques identifiés par URL.
  const [couches, setCouches] = useState<string[]>([]);

  useEffect(() => {
    if (illustrationsDisponibles !== true || !urlDetouree) return;
    setCouches((prec) => {
      if (prec[prec.length - 1] === urlDetouree) return prec; // déjà affichée
      return [...prec, urlDetouree];
    });
  }, [urlDetouree, illustrationsDisponibles]);

  // Une fois le fondu terminé, on retire les calques recouverts : sans
  // ça, une navigation rapide accumulerait des <img> invisibles inutiles.
  useEffect(() => {
    if (couches.length <= 1) return;
    const t = setTimeout(() => {
      setCouches((prec) => (prec.length > 1 ? [prec[prec.length - 1]] : prec));
    }, DUREE_FONDU_MS);
    return () => clearTimeout(t);
  }, [couches]);

  // Recentre le défilement horizontal à chaque nouvelle photo, une fois
  // chargée (pour connaître sa largeur réelle une fois son ratio connu).
  const scrollRef = useRef<HTMLDivElement>(null);
  function recentrer() {
    const el = scrollRef.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }

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

  return (
    <div id="tree-wrap" className={visible ? "entree" : ""}>
      {illustrationsDisponibles === true ? (
        <div id="tree-photo" role="img" aria-label={`l'arbre, jour ${Math.round(etape)}`}>
          <div id="tree-photo-scroll" ref={scrollRef}>
            {couches.map((url, i) => (
              <CoucheArbre
                key={url}
                url={url}
                active={i === couches.length - 1}
                zIndex={i}
                onLoad={recentrer}
              />
            ))}
          </div>
        </div>
      ) : illustrationsDisponibles === false ? (
        <div id="tree-fallback" className="actif" dangerouslySetInnerHTML={{ __html: svgSecours }} />
      ) : null}
    </div>
  );
}

/**
 * Un calque de la pile. Monte à opacité 0 puis passe à 1 une frame plus
 * tard (sinon le navigateur peint directement l'état final sans jouer la
 * transition CSS — un nœud DOM tout juste créé n'a rien à transitionner
 * *depuis*).
 */
function CoucheArbre({
  url,
  active,
  zIndex,
  onLoad,
}: {
  url: string;
  active: boolean;
  zIndex: number;
  onLoad: () => void;
}) {
  const [prete, setPrete] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setPrete(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <img
      src={url}
      alt=""
      className="tree-photo-layer"
      style={{ opacity: prete && active ? 1 : 0, zIndex }}
      onLoad={onLoad}
    />
  );
}
