/**
 * Génère un arbre "aquarelle" en SVG, procéduralement, à partir d'une étape
 * de croissance (1 à totalEtapes) et d'une saison.
 *
 * Sert de SECOURS : si de vraies images tree-XXX.png existent dans
 * /public/assets/tree/, elles sont utilisées à la place (voir <Arbre />).
 *
 * C'est UN SEUL arbre qui grandit : son squelette complet (troncs, branches,
 * pointes de feuillage) est construit une seule fois avec une graine fixe,
 * puis chaque étape n'en révèle qu'une partie — le tronc s'allonge d'abord,
 * les branches se déploient niveau par niveau, le feuillage éclot à la fin.
 * D'une semaine à l'autre, ce sont donc les MÊMES branches qui continuent
 * de pousser, au lieu d'un nouvel arbre aléatoire à chaque étape.
 */
import rough from "roughjs";
import type { RoughGenerator } from "roughjs/bin/generator";
import type { Drawable } from "roughjs/bin/core";
import type { Saison } from "../types";

type Rand = () => number;

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number; // largeur à taille adulte
  niveau: number; // 0 = tronc, puis 1, 2, ... vers les rameaux
}

interface Pointe {
  x: number;
  y: number;
  r: number; // rayon du feuillage à taille adulte
  bloomStart: number; // progression à laquelle le feuillage commence à éclore
}

interface Squelette {
  segments: Segment[];
  pointes: Pointe[];
  viewBox: string;
}

interface Palette {
  feuillage: string[];
  accent: string;
  ecorce: string;
  sol: string;
  densite: number;
}

const PALETTES_ARBRE: Record<Saison, Palette> = {
  hiver: { feuillage: ["#5f6f52", "#6f7a5e"], accent: "#f2f6f2", ecorce: "#4a3c2e", sol: "#cdd3c9", densite: 0.12 },
  printemps: { feuillage: ["#9fb97c", "#87a866", "#b7cf95"], accent: "#e7b8c9", ecorce: "#6b4f39", sol: "#a9b98a", densite: 0.85 },
  ete: { feuillage: ["#5f8a4a", "#4f7a3d", "#79a35e"], accent: "#f4d78a", ecorce: "#5b4636", sol: "#7f9a5c", densite: 1 },
  automne: { feuillage: ["#c9822c", "#a8551f", "#d9a441", "#b5451f"], accent: "#e0c25a", ecorce: "#5b4636", sol: "#b98a4a", densite: 0.72 },
};

/** Graine fixe : le même arbre toute l'année, toutes les années. */
const SEED_ARBRE = 987;

const BASE_X = 200;
const BASE_Y = 372;
const PROFONDEUR_MAX = 5; // niveaux de ramification
const NB_NIVEAUX = PROFONDEUR_MAX + 1;
/** Le bois (tronc + branches) finit de se déployer à 40 % de l'année ;
    le reste du temps, le feuillage éclot et l'ensemble continue de grandir. */
const FIN_BOIS = 0.4;
const DUREE_NIVEAU = FIN_BOIS / NB_NIVEAUX;

function mulberry32(seed: number): Rand {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function smoothBlobPath(cx: number, cy: number, r: number, rand: Rand, irregularity = 0.35, points = 9): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const rr = r * (1 - irregularity / 2 + rand() * irregularity);
    pts.push([cx + Math.cos(angle) * rr, cy + Math.sin(angle) * rr * 0.92]);
  }
  const n = pts.length;
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} `;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} `;
  }
  d += "Z";
  return d;
}

function easeCroissance(t: number): number {
  return 1 - Math.pow(1 - t, 1.6);
}

/**
 * Générateur Rough.js (indépendant du DOM : fonctionne dans le navigateur
 * comme dans le script d'export Node). C'est lui qui donne au trait son
 * aspect croqué à main levée — contours tremblés, hachures.
 */
const roughGen: RoughGenerator = rough.generator();

/** Convertit un dessin Rough.js en balises <path> SVG. */
function drawableEnSVG(drawable: Drawable, opacite: number): string {
  let sortie = "";
  for (const info of roughGen.toPaths(drawable)) {
    const stroke = info.stroke && info.stroke !== "none" ? info.stroke : "none";
    const fill = info.fill && info.fill !== "none" ? info.fill : "none";
    sortie += `<path d="${info.d}" stroke="${stroke}" stroke-width="${info.strokeWidth}" fill="${fill}" stroke-linecap="round" opacity="${opacite.toFixed(2)}" />`;
  }
  return sortie;
}

let squeletteCache: Squelette | null = null;

function construireSquelette(): Squelette {
  const rand = mulberry32(SEED_ARBRE);
  const segments: Segment[] = [];
  const pointes: Pointe[] = [];

  function grow(x: number, y: number, angle: number, length: number, width: number, depth: number) {
    const endX = x + Math.sin(angle) * length;
    const endY = y - Math.cos(angle) * length;
    const niveau = PROFONDEUR_MAX - depth;
    segments.push({ x1: x, y1: y, x2: endX, y2: endY, width: Math.max(0.6, width), niveau });

    if (depth <= 0 || length < 9) {
      const finBranche = (niveau + 1) * DUREE_NIVEAU;
      pointes.push({
        x: endX,
        y: endY,
        r: 35 * (0.65 + rand() * 0.55),
        // Chaque touffe éclot à un moment un peu différent, jamais avant
        // que sa branche porteuse soit complète.
        bloomStart: Math.max(finBranche, 0.22 + rand() * 0.22),
      });
      return;
    }

    const doSplit = depth !== PROFONDEUR_MAX && rand() > 0.3;
    const branchCount = doSplit ? 2 : 1;
    for (let i = 0; i < branchCount; i++) {
      let newAngle: number;
      if (branchCount === 1) {
        newAngle = angle + (rand() - 0.5) * 0.3;
      } else {
        const spread = 0.3 + rand() * 0.35;
        const dir = i === 0 ? -1 : 1;
        newAngle = angle + dir * spread + (rand() - 0.5) * 0.12;
      }
      newAngle = Math.max(-1.35, Math.min(1.35, newAngle * 0.9));
      const newLength = length * (0.66 + rand() * 0.14);
      const newWidth = width * 0.68;
      grow(endX, endY, newAngle, newLength, newWidth, depth - 1);
    }
  }

  grow(BASE_X, BASE_Y, (rand() - 0.5) * 0.08, 236, 27, PROFONDEUR_MAX);

  // Cadre calculé sur l'arbre adulte : comme chaque étape n'est qu'une
  // version réduite/partielle du même squelette, il reste valable toute
  // l'année — l'arbre ne "saute" jamais hors du cadre.
  let minX = BASE_X, maxX = BASE_X, minY = BASE_Y, maxY = BASE_Y + 46;
  for (const s of segments) {
    minX = Math.min(minX, s.x1, s.x2);
    maxX = Math.max(maxX, s.x1, s.x2);
    minY = Math.min(minY, s.y1, s.y2);
    maxY = Math.max(maxY, s.y1, s.y2);
  }
  for (const p of pointes) {
    minX = Math.min(minX, p.x - p.r * 1.4);
    maxX = Math.max(maxX, p.x + p.r * 1.4);
    minY = Math.min(minY, p.y - p.r * 1.4);
    maxY = Math.max(maxY, p.y + p.r * 1.4);
  }
  const marge = 30;
  const viewBox = `${(minX - marge).toFixed(0)} ${(minY - marge).toFixed(0)} ${(maxX - minX + marge * 2).toFixed(0)} ${(maxY - minY + marge * 2).toFixed(0)}`;

  return { segments, pointes, viewBox };
}

export function genererArbreSVG(etape: number, totalEtapes: number, saison: Saison): string {
  const progress = clamp01(etape / totalEtapes);
  const squelette = (squeletteCache ??= construireSquelette());
  const palette = PALETTES_ARBRE[saison];

  // Échelle globale : le jeune arbre est petit, l'adulte plein cadre.
  // Le minimum est volontairement assez haut pour que la toute jeune
  // pousse soit déjà bien visible à l'écran dès les premières semaines.
  const s = 0.3 + 0.7 * easeCroissance(progress);

  // Deux passes pour le bois : un lavis plein (la masse aquarelle), puis
  // par-dessus un trait d'encre Rough.js, plus fin et tremblé, comme
  // repassé à la plume dans un carnet.
  let lavisBranchesSVG = "";
  let encreBranchesSVG = "";
  for (let i = 0; i < squelette.segments.length; i++) {
    const seg = squelette.segments[i];
    // Chaque niveau de branches pousse pendant sa propre fenêtre de temps.
    // L'exposant < 1 accélère le début de chaque pousse : une branche
    // naissante devient vite visible, puis finit sa course en douceur.
    const fLineaire = clamp01((progress - seg.niveau * DUREE_NIVEAU) / DUREE_NIVEAU);
    if (fLineaire <= 0) continue;
    const f = Math.pow(fLineaire, 0.65);
    const x1 = BASE_X + (seg.x1 - BASE_X) * s;
    const y1 = BASE_Y + (seg.y1 - BASE_Y) * s;
    const x2 = x1 + (seg.x2 - seg.x1) * s * f;
    const y2 = y1 + (seg.y2 - seg.y1) * s * f;
    const w = Math.max(0.6, seg.width * Math.pow(s, 1.4));

    lavisBranchesSVG += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${palette.ecorce}" stroke-width="${w.toFixed(1)}" stroke-linecap="round" opacity="0.6" />`;

    // Graine fixe par segment : le tremblé du trait est stable d'une
    // semaine à l'autre (pas de scintillement).
    const encre = roughGen.line(x1, y1, x2, y2, {
      seed: 100 + i,
      stroke: palette.ecorce,
      strokeWidth: Math.max(1, 1 + w * 0.22),
      roughness: Math.min(2, 0.9 + w * 0.04),
      bowing: 1.6,
      disableMultiStroke: w < 4,
    });
    encreBranchesSVG += drawableEnSVG(encre, 0.9);
  }

  let foliageSVG = "";
  let encreFeuillageSVG = "";
  for (let i = 0; i < squelette.pointes.length; i++) {
    const pointe = squelette.pointes[i];
    // Un flux aléatoire indépendant par touffe : le dessin d'une touffe est
    // identique d'une semaine à l'autre (pas de scintillement), et masquer
    // les touffes non écloses ne décale pas les autres.
    const randTouffe = mulberry32(SEED_ARBRE + 1000 + i);
    if (randTouffe() > palette.densite) continue;
    const bloom = clamp01((progress - pointe.bloomStart) / 0.18);
    if (bloom <= 0) continue;

    const cx = BASE_X + (pointe.x - BASE_X) * s;
    const cy = BASE_Y + (pointe.y - BASE_Y) * s;
    const rBase = pointe.r * s * (0.35 + 0.65 * bloom);

    const nLayers = 2 + Math.floor(randTouffe() * 2);
    for (let l = 0; l < nLayers; l++) {
      const color = palette.feuillage[Math.floor(randTouffe() * palette.feuillage.length)];
      const rr = rBase * (0.7 + randTouffe() * 0.5) * (1 - l * 0.14);
      const ox = (randTouffe() - 0.5) * rBase * 0.5;
      const oy = (randTouffe() - 0.5) * rBase * 0.5;
      const path = smoothBlobPath(cx + ox, cy + oy, rr, randTouffe, 0.4, 8);
      const opacity = ((0.34 + randTouffe() * 0.28) * (0.45 + 0.55 * bloom)).toFixed(2);
      foliageSVG += `<path d="${path}" fill="${color}" opacity="${opacity}" />`;
    }

    // Hachures Rough.js par-dessus le lavis : l'ombrage au crayon du
    // carnet. Une touffe sur deux environ, pour rester léger.
    if (randTouffe() > 0.45 && rBase > 6) {
      const teinte = palette.feuillage[Math.floor(randTouffe() * palette.feuillage.length)];
      const hachures = roughGen.ellipse(cx, cy, rBase * 2.1, rBase * 1.8, {
        seed: 500 + i,
        stroke: "none",
        fill: teinte,
        fillStyle: "hachure",
        hachureAngle: -30 + randTouffe() * 60,
        hachureGap: Math.max(3.5, rBase * 0.3),
        fillWeight: 0.9,
        roughness: 1.8,
      });
      encreFeuillageSVG += drawableEnSVG(hachures, 0.5 * bloom);
    }

    if (saison === "printemps" && bloom > 0.5 && randTouffe() > 0.6) {
      const bx = cx + (randTouffe() - 0.5) * rBase;
      const by = cy + (randTouffe() - 0.5) * rBase;
      foliageSVG += `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${(2 + randTouffe() * 2.5).toFixed(1)}" fill="${palette.accent}" opacity="0.75" />`;
    }
    if (saison === "hiver" && randTouffe() > 0.55) {
      const sx = cx + (randTouffe() - 0.5) * rBase * 0.6;
      const sy = cy - rBase * 0.35;
      foliageSVG += `<ellipse cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" rx="${(3 + randTouffe() * 4).toFixed(1)}" ry="${(1.4 + randTouffe() * 1.8).toFixed(1)}" fill="${palette.accent}" opacity="0.8" />`;
    }
  }

  const solPath = smoothBlobPath(BASE_X, BASE_Y + 6, 60 + progress * 40, mulberry32(SEED_ARBRE + 7), 0.3, 10);

  return `
<svg viewBox="${squelette.viewBox}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="un arbre">
  <defs>
    <filter id="wc-rough-arbre" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="${SEED_ARBRE % 999}" result="turb" />
      <feDisplacementMap in="SourceGraphic" in2="turb" scale="7" xChannelSelector="R" yChannelSelector="G" />
    </filter>
    <filter id="wc-soft-arbre">
      <feGaussianBlur stdDeviation="1.1" />
    </filter>
  </defs>
  <g filter="url(#wc-rough-arbre)">
    <path d="${solPath}" fill="${palette.sol}" opacity="0.3" />
    <g filter="url(#wc-soft-arbre)">${foliageSVG}</g>
    ${lavisBranchesSVG}
    ${encreBranchesSVG}
    ${encreFeuillageSVG}
  </g>
</svg>`.trim();
}
