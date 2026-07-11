import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
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

const ZOOM_MAX = 4;
const ZOOM_DOUBLE_TAP = 2.2;

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
 * glisse alors horizontalement pour en voir le reste. On peut aussi
 * pincer à deux doigts pour zoomer (le point pincé reste stable à
 * l'écran), ou double-tapoter pour zoomer/revenir d'un coup. Chaque
 * nouvelle photo s'ouvre recentrée et dézoomée.
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const { zoom, resetZoom } = usePinchZoom(scrollRef);

  // À chaque nouvelle photo (une fois chargée, pour connaître ses
  // dimensions réelles) : dézoome et recentre horizontalement.
  function onImageChargee(e: React.SyntheticEvent<HTMLImageElement>) {
    const el = scrollRef.current;
    const img = e.currentTarget;
    if (!el || !img.naturalWidth || !img.naturalHeight) return;
    resetZoom();
    const largeur = img.naturalWidth * (el.clientHeight / img.naturalHeight);
    el.scrollLeft = (largeur - el.clientWidth) / 2;
    el.scrollTop = 0;
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
                zoom={zoom}
                onLoad={onImageChargee}
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
 * *depuis*). La hauteur suit le niveau de zoom ; la largeur (auto) suit
 * le ratio d'origine de l'image, d'où le débordement horizontal (et
 * vertical, une fois zoomé) qu'on parcourt par glissement.
 */
function CoucheArbre({
  url,
  active,
  zIndex,
  zoom,
  onLoad,
}: {
  url: string;
  active: boolean;
  zIndex: number;
  zoom: number;
  onLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
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
      style={{ opacity: prete && active ? 1 : 0, zIndex, height: `${zoom * 100}%` }}
      onLoad={onLoad}
    />
  );
}

/**
 * Pincement à deux doigts pour zoomer (le point pincé reste stable à
 * l'écran), double-tap pour zoomer/revenir. Le déplacement une fois
 * zoomé passe par le défilement natif du conteneur (un seul doigt) :
 * cette fonction ne fait qu'ajuster le zoom et compenser le défilement
 * en conséquence, elle ne gère aucun geste à un seul doigt.
 */
function usePinchZoom(ref: RefObject<HTMLDivElement | null>) {
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const pincement = useRef<{ distance: number } | null>(null);
  const debutTap = useRef<{ x: number; y: number; temps: number } | null>(null);
  const dernierTap = useRef(0);

  const resetZoom = useCallback(() => {
    zoomRef.current = 1;
    setZoom(1);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function appliquerZoom(nouveau: number, centreXPage: number, centreYPage: number) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centreX = centreXPage - rect.left;
      const centreY = centreYPage - rect.top;
      const facteur = nouveau / zoomRef.current;
      el.scrollLeft = (el.scrollLeft + centreX) * facteur - centreX;
      el.scrollTop = (el.scrollTop + centreY) * facteur - centreY;
      zoomRef.current = nouveau;
      setZoom(nouveau);
    }

    function distanceEntre(t: TouchList) {
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.hypot(dx, dy);
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        pincement.current = { distance: distanceEntre(e.touches) };
        debutTap.current = null;
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        debutTap.current = { x: t.clientX, y: t.clientY, temps: Date.now() };
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 2 || !pincement.current) return;
      e.preventDefault(); // on gère ce geste nous-mêmes, pas le navigateur
      const distance = distanceEntre(e.touches);
      const ratio = distance / pincement.current.distance;
      pincement.current.distance = distance;
      const nouveau = Math.min(ZOOM_MAX, Math.max(1, zoomRef.current * ratio));
      if (nouveau === zoomRef.current) return;
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      appliquerZoom(nouveau, cx, cy);
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) pincement.current = null;
      if (e.touches.length > 0 || !debutTap.current) return;

      const { x, y, temps } = debutTap.current;
      debutTap.current = null;
      const t = e.changedTouches[0];
      if (!t) return;

      // Un tap, pas un glissement : doigt resté quasi immobile, geste bref.
      const bouge = Math.hypot(t.clientX - x, t.clientY - y) > 12;
      if (bouge || Date.now() - temps > 400) {
        dernierTap.current = 0;
        return;
      }

      const maintenant = Date.now();
      if (maintenant - dernierTap.current < 300) {
        if (zoomRef.current > 1.05) resetZoom();
        else appliquerZoom(ZOOM_DOUBLE_TAP, t.clientX, t.clientY);
        dernierTap.current = 0;
      } else {
        dernierTap.current = maintenant;
      }
    }

    function onTouchCancel() {
      pincement.current = null;
      debutTap.current = null;
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchCancel, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [ref, resetZoom]);

  return { zoom, resetZoom };
}
