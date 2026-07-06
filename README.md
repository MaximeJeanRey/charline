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
    useImageExiste.ts       vérifie si une image (PNG/JPG) est disponible
    useReduireMouvement.ts  respecte prefers-reduced-motion
  components/
    Scene.tsx                assemble tout, aucune navigation
    FondSaison.tsx           fondu croisé entre deux fonds de saison
    Arbre.tsx                 vraie image ou secours généré
    CanevasMeteo.tsx          neige / pollen / lucioles / feuilles
    Ambiance.tsx               phrase poétique + âge en jours
  styles.css
```

## Configurer

Tout se règle dans [`src/config.ts`](src/config.ts) :

```ts
export const CONFIG = {
  DATE_DEBUT: "2024-01-01",       // jour zéro de l'arbre
  TOTAL_ETAPES: 52,               // une image par semaine
  PHRASE_POETIQUE: "...",         // la phrase affichée discrètement
  AFFICHER_AGE: true,             // afficher l'âge en jours
};
```

## Les illustrations de l'arbre

Les illustrations aquarelle vivent dans `public/imgs/`, nommées par numéro
de semaine : `1.png`, `2.png`, … jusqu'à `52.png` (l'arbre majestueux
final). Il n'est pas nécessaire d'avoir les 52 : la liste des numéros
réellement présents est déclarée dans `STAGES_IMAGES` (voir
[`src/config.ts`](src/config.ts)), et chaque semaine affiche l'illustration
disponible la plus proche. Pour affiner la croissance, ajoute simplement le
PNG (`10.png`, `11.png`, …) et son numéro dans `STAGES_IMAGES`.

Le passage d'un stade au suivant se fait en **fondu enchaîné** : même un
grand écart (par ex. de la semaine 9 à la 52) devient une lente
dissolution plutôt qu'un à-coup. Les illustrations ayant un fond blanc,
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
les branches s'allongent semaine après semaine. Le dessin combine un lavis
aquarelle (taches floues, déformation SVG) et un trait d'encre croqué rendu
avec [Rough.js](https://roughjs.com), comme dans un carnet de voyage.

## Exporter les 52 stades en images

```bash
npm run generer:arbres
```

Écrit `apercu-arbres/tree-001.svg` → `tree-052.svg` (chaque semaine avec la
saison correspondante, calée sur `DATE_DEBUT`) ainsi qu'une planche
`apercu-arbres/planche.html` qui affiche toute l'année d'un seul regard.
Le site n'a pas besoin de ces fichiers — il génère l'arbre en direct — la
planche sert à contrôler visuellement l'ensemble de la croissance.

## Aperçu accéléré

Ajoute `?apercu` à l'URL (ex. `http://localhost:5173/?apercu`) pour voir
l'arbre grandir en continu — les 52 semaines et les 4 saisons défilent en
boucle sur 52 secondes, au lieu d'une vraie année. Dans ce mode la
croissance est fluide (progression fractionnaire), là où l'expérience
réelle avance par paliers d'une semaine. Volontairement caché derrière un
paramètre d'URL plutôt qu'un bouton : l'expérience réelle ne doit avoir
aucune navigation visible.

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
