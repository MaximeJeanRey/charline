/**
 * Animations météo très discrètes, propres à chaque saison :
 *   hiver      -> neige
 *   printemps  -> pollen / pétales
 *   ete        -> lumière flottante / lucioles
 *   automne    -> feuilles tombantes
 *
 * Moteur imprératif, indépendant de React : `initMeteo` démarre la boucle
 * sur un <canvas> et retourne une fonction pour l'arrêter proprement.
 * C'est le hook `useMeteo` (src/hooks/useMeteo.ts) qui l'appelle depuis un
 * useEffect et gère le cycle de vie.
 */
import type { Saison } from "../types";

type TypeParticule = "neige" | "petale" | "luciole" | "feuille";

interface Particule {
  type: TypeParticule;
  x: number;
  y: number;
  seed: number;
  r: number;
  vy: number;
  drift: number;
  opacity?: number;
  rot?: number;
  vrot?: number;
  couleur?: string;
  phase?: number;
  vphase?: number;
}

const CONFIGS: Record<Saison, { count: number; type: TypeParticule }> = {
  hiver: { count: 46, type: "neige" },
  printemps: { count: 20, type: "petale" },
  ete: { count: 16, type: "luciole" },
  automne: { count: 24, type: "feuille" },
};

function creerParticule(type: TypeParticule, w: number, h: number, initial: boolean): Particule {
  const base: Particule = {
    type,
    x: Math.random() * w,
    y: initial ? Math.random() * h : -20 - Math.random() * 60,
    seed: Math.random() * 1000,
    r: 0,
    vy: 0,
    drift: 0,
  };
  if (type === "neige") {
    return { ...base, r: 1 + Math.random() * 2.2, vy: 0.25 + Math.random() * 0.5, drift: 0.4 + Math.random() * 0.6, opacity: 0.35 + Math.random() * 0.5 };
  }
  if (type === "petale") {
    return {
      ...base,
      r: 3 + Math.random() * 3,
      vy: 0.2 + Math.random() * 0.35,
      drift: 0.6 + Math.random() * 0.8,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.02,
      opacity: 0.4 + Math.random() * 0.4,
      couleur: Math.random() > 0.5 ? "#f3d9e4" : "#f7ecd8",
    };
  }
  if (type === "luciole") {
    return {
      ...base,
      r: 1.4 + Math.random() * 1.6,
      vy: -(0.06 + Math.random() * 0.1),
      drift: 0.15 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      vphase: 0.02 + Math.random() * 0.02,
      y: Math.random() * h,
    };
  }
  return {
    ...base,
    r: 4 + Math.random() * 3.5,
    vy: 0.3 + Math.random() * 0.45,
    drift: 0.8 + Math.random() * 1,
    rot: Math.random() * Math.PI * 2,
    vrot: (Math.random() - 0.5) * 0.03,
    opacity: 0.5 + Math.random() * 0.35,
    couleur: ["#c9822c", "#a8551f", "#d9a441"][Math.floor(Math.random() * 3)],
  };
}

function dessinerNeige(ctx: CanvasRenderingContext2D, p: Particule) {
  ctx.globalAlpha = p.opacity ?? 1;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();
}

function dessinerPetale(ctx: CanvasRenderingContext2D, p: Particule) {
  ctx.save();
  ctx.globalAlpha = p.opacity ?? 1;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot ?? 0);
  ctx.fillStyle = p.couleur ?? "#f3d9e4";
  ctx.beginPath();
  ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function dessinerLuciole(ctx: CanvasRenderingContext2D, p: Particule) {
  const scintillement = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(p.phase ?? 0));
  ctx.save();
  ctx.globalAlpha = scintillement * 0.85;
  const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
  grad.addColorStop(0, "rgba(255, 244, 190, 0.9)");
  grad.addColorStop(1, "rgba(255, 244, 190, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = scintillement;
  ctx.fillStyle = "#fff6d6";
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function dessinerFeuille(ctx: CanvasRenderingContext2D, p: Particule) {
  ctx.save();
  ctx.globalAlpha = p.opacity ?? 1;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot ?? 0);
  ctx.fillStyle = p.couleur ?? "#c9822c";
  ctx.beginPath();
  ctx.ellipse(0, 0, p.r, p.r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const DESSIN: Record<TypeParticule, (ctx: CanvasRenderingContext2D, p: Particule) => void> = {
  neige: dessinerNeige,
  petale: dessinerPetale,
  luciole: dessinerLuciole,
  feuille: dessinerFeuille,
};

export function initMeteo(canvas: HTMLCanvasElement, saison: Saison, reduireMouvement: boolean): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let w = 0;
  let h = 0;
  let particules: Particule[] = [];
  let actif = true;
  let rafId = 0;

  function redimensionner() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const cfg = CONFIGS[saison];
  const count = reduireMouvement ? 0 : cfg.count;

  function initParticules() {
    particules = [];
    for (let i = 0; i < count; i++) {
      particules.push(creerParticule(cfg.type, w, h, true));
    }
  }

  function maj(p: Particule) {
    if (p.type === "luciole") {
      p.phase = (p.phase ?? 0) + (p.vphase ?? 0);
      p.x += Math.sin(p.phase * 0.5 + p.seed) * p.drift * 0.05;
      p.y += p.vy;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;
      return;
    }
    p.y += p.vy;
    p.x += Math.sin((p.y + p.seed) * 0.02) * p.drift * 0.06;
    if (p.rot !== undefined) p.rot += p.vrot ?? 0;
    if (p.y > h + 20) {
      Object.assign(p, creerParticule(p.type, w, h, false));
      p.x = Math.random() * w;
    }
  }

  function boucle() {
    if (!actif) return;
    ctx!.clearRect(0, 0, w, h);
    for (const p of particules) {
      maj(p);
      DESSIN[p.type](ctx!, p);
    }
    ctx!.globalAlpha = 1;
    rafId = requestAnimationFrame(boucle);
  }

  redimensionner();
  initParticules();
  const onResize = () => redimensionner();
  window.addEventListener("resize", onResize);

  if (count > 0) {
    boucle();
  } else {
    ctx.clearRect(0, 0, w, h);
  }

  return function arreter() {
    actif = false;
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener("resize", onResize);
    ctx!.clearRect(0, 0, w, h);
  };
}
