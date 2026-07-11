# l'arbre

Une expérience contemplative, pas une application. Un tag NFC cousu dans un
vêtement mène directement à un arbre qui grandit avec le temps, sur fond de
saisons qui changent — sans écran d'accueil, sans navigation, sans rien
d'autre à faire qu'ouvrir la page.

Construit en **React + TypeScript** (via Vite), déployé comme site statique
sur GitHub Pages.

## Pourquoi React ici

Le site n'a besoin d'aucune interactivité complexe — il a été pensé pour
servir de support pour apprendre la structure d'un projet React/TS typé :
composants, hooks personnalisés, et une séparation nette entre logique
(`src/lib`, `src/hooks`) et affichage (`src/components`).

## Structure

```
src/
  config.ts              réglages éditables (DATE_DEBUT, phrase, ...)
  types.ts                types partagés (Saison, ...)
  lib/
    temps.ts              calcul des jours écoulés, de l'étape, de la saison
    watercolorTree.ts      génération de l'arbre aquarelle en SVG (secours)
    meteo.ts                moteur canvas des particules météo
  hooks/
    useHorloge.ts           date courante, rafraîchie périodiquement
    useNavigationJours.ts   navigation dans les jours précédents (jamais au-delà d'aujourd'hui)
    useImageExiste.ts       vérifie si une image (PNG/JPG) est disponible
    useReduireMouvement.ts  respecte prefers-reduced-motion
  components/
    Scene.tsx                assemble tout
    FondSaison.tsx           fondu croisé entre deux fonds de saison
    Arbre.tsx                 vraie image ou secours généré
    CanevasMeteo.tsx          neige / pollen / lucioles / feuilles
    Ambiance.tsx               jour actuel + navigation jours précédents
  styles.css
```

## Configurer

Tout se règle dans [`src/config.ts`](src/config.ts) :

```ts
export const CONFIG = {
  DATE_DEBUT: "2024-01-01",       // jour zéro de l'arbre
  TOTAL_ETAPES: 446,              // une image par jour (adapte à ton nombre d'images)
  AFFICHER_AGE: true,             // afficher le message d'ambiance (jour + prochaine pousse)
};
```

## Les illustrations de l'arbre

Les illustrations aquarelle vivent dans `public/imgs/`, nommées par numéro
de jour : `1.png`, `2.png`, … jusqu'à `TOTAL_ETAPES.png` (l'arbre
majestueux final). Il n'est pas nécessaire d'avoir une image par jour : la
liste des numéros réellement présents est déclarée dans `STAGES_IMAGES`
(voir [`src/config.ts`](src/config.ts)), et chaque jour affiche
l'illustration disponible la plus proche. Pour affiner la croissance,
ajoute simplement le PNG (`70.png`, `100.png`, …) et son numéro dans
`STAGES_IMAGES`.

Le passage d'un stade au suivant se fait en **fondu enchaîné** : même un
grand écart entre deux numéros disponibles devient une lente dissolution
plutôt qu'un à-coup. Les illustrations ayant un fond blanc,
celui-ci est **détouré à la volée** (voir `src/lib/detourage.ts`) : le
blanc du papier devient transparent, si bien que l'arbre repose directement
sur la scène et que la saison passe entre les feuilles. Le détourage se
fait par transparence progressive (alpha selon la clarté du pixel), ce qui
préserve les bords doux et diffus de l'aquarelle.

Fonds de saison (facultatif) : dépose
`public/assets/backgrounds/winter.jpg`, `spring.jpg`, `summer.jpg`,
`autumn.jpg`. Sans eux, de doux dégradés de saison servent de secours.

Si aucune illustration n'est trouvée dans `public/imgs/`, l'arbre est
dessiné à la volée en SVG (voir plus bas) — l'expérience reste complète.

### L'arbre dessiné (secours)

En l'absence d'images, un arbre aquarelle est généré en SVG : construit une
seule fois (graine fixe) puis révélé progressivement — le même arbre dont
les branches s'allongent jour après jour. Le dessin combine un lavis
aquarelle (taches floues, déformation SVG) et un trait d'encre croqué rendu
avec [Rough.js](https://roughjs.com), comme dans un carnet de voyage.

## Exporter tous les stades en images

```bash
npm run generer:arbres
```

Écrit `apercu-arbres/tree-001.svg` → `tree-TOTAL_ETAPES.svg` (chaque jour
avec la saison correspondante, calée sur `DATE_DEBUT`) ainsi qu'une planche
`apercu-arbres/planche.html` qui affiche toute la période d'un seul
regard. Le site n'a pas besoin de ces fichiers — il génère l'arbre en
direct — la planche sert à contrôler visuellement l'ensemble de la
croissance.

## Revoir les jours précédents

Deux flèches discrètes de part et d'autre du jour actuel (ou les touches
← →) permettent de feuilleter les jours déjà vécus par l'arbre : l'image
et le fond de saison affichés correspondent alors à ce jour-là, pas à
aujourd'hui. Impossible en revanche d'aller au-delà d'aujourd'hui — la
flèche suivante reste désactivée tant qu'on n'a pas reculé — pour que la
croissance à venir reste une surprise. Un lien "revenir à aujourd'hui"
remplace le message de prochaine pousse pendant qu'on navigue dans le
passé. Logique dans [`src/hooks/useNavigationJours.ts`](src/hooks/useNavigationJours.ts).

## Aperçu accéléré

Ajoute `?apercu` à l'URL (ex. `http://localhost:5173/?apercu`) pour voir
l'arbre grandir en continu — tous les jours et les 4 saisons défilent en
boucle sur 52 secondes, au lieu d'attendre en vrai. Dans ce mode la
croissance est fluide (progression fractionnaire), là où l'expérience
réelle avance par paliers d'un jour. Volontairement caché derrière un
paramètre d'URL plutôt qu'un bouton : c'est un outil de test, pas une
fonctionnalité de l'expérience elle-même.

## Développer en local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build      # génère dist/, prêt à héberger tel quel
npm run preview    # sert dist/ localement pour vérifier le build
```

## Déployer sur GitHub Pages

Un workflow GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml))
build et publie automatiquement `dist/` à chaque push sur `main`.

```bash
git remote add origin <url-de-ton-repo>
git push -u origin main
```

Puis, sur GitHub : **Settings → Pages → Source : GitHub Actions**. Le site
sera servi à `https://<utilisateur>.github.io/<repo>/` après le premier run
du workflow (onglet **Actions** du repo).

`vite.config.ts` utilise `base: "./"` (chemin relatif), donc aucun réglage
supplémentaire n'est nécessaire quel que soit le nom du dépôt.

Alternative manuelle, sans Actions :

```bash
npm run deploy   # publie dist/ sur la branche gh-pages via le paquet gh-pages
```
