/**
 * Exporte les stades de croissance de l'arbre en fichiers SVG (un par jour,
 * cf. CONFIG.TOTAL_ETAPES), avec la saison correspondant à chaque jour
 * (calée sur DATE_DEBUT), plus une planche HTML (planche.html) pour tous
 * les visualiser d'un coup.
 *
 *   npm run generer:arbres
 *
 * Les fichiers sont écrits dans apercu-arbres/ (non versionné : ils se
 * régénèrent à la demande). Le site n'en a pas besoin pour fonctionner —
 * il génère l'arbre en direct — mais la planche permet de contrôler
 * l'ensemble de l'année d'un seul regard.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CONFIG } from "../src/config";
import { genererArbreSVG } from "../src/lib/watercolorTree";
import { saisonActuelle } from "../src/lib/temps";

const DOSSIER = "apercu-arbres";
const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

mkdirSync(DOSSIER, { recursive: true });

const debut = new Date(CONFIG.DATE_DEBUT + "T00:00:00");
let figures = "";

for (let etape = 1; etape <= CONFIG.TOTAL_ETAPES; etape++) {
  // Jour correspondant, pour déterminer sa saison.
  const date = new Date(debut.getTime() + (etape - 1) * MS_PAR_JOUR);
  const saison = saisonActuelle(date);
  const svg = genererArbreSVG(etape, CONFIG.TOTAL_ETAPES, saison);
  const nom = `tree-${String(etape).padStart(3, "0")}.svg`;
  writeFileSync(join(DOSSIER, nom), svg, "utf8");
  figures += `    <figure><img src="${nom}" alt="jour ${etape}" loading="lazy"><figcaption>jour ${etape} · ${saison}</figcaption></figure>\n`;
}

const planche = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>l'arbre — les ${CONFIG.TOTAL_ETAPES} jours</title>
<style>
  body {
    margin: 0;
    padding: 3rem 2rem;
    background: #f2ecdd;
    color: #3d3226;
    font-family: Georgia, "Times New Roman", serif;
  }
  h1 {
    font-weight: normal;
    font-style: italic;
    text-align: center;
    margin: 0 0 2.5rem;
    letter-spacing: 0.04em;
  }
  main {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1.6rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  figure {
    margin: 0;
    text-align: center;
  }
  img {
    width: 100%;
    height: 190px;
    object-fit: contain;
    filter: drop-shadow(0 6px 8px rgba(61, 50, 38, 0.18));
  }
  figcaption {
    margin-top: 0.5rem;
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.6;
  }
</style>
</head>
<body>
  <h1>l'arbre, jour après jour</h1>
  <main>
${figures}  </main>
</body>
</html>
`;

writeFileSync(join(DOSSIER, "planche.html"), planche, "utf8");

console.log(`${CONFIG.TOTAL_ETAPES} images écrites dans ${DOSSIER}/`);
console.log(`Ouvre ${DOSSIER}/planche.html pour tout voir d'un coup.`);
