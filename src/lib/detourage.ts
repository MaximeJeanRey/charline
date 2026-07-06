/**
 * Détoure le fond blanc d'une illustration : le papier blanc devient
 * transparent pour que l'arbre repose directement sur la scène (la saison
 * passe alors entre les feuilles) au lieu d'un rectangle blanc.
 *
 * Fait à la volée dans un <canvas>, pixel par pixel — aucune dépendance,
 * et fonctionne pour n'importe quelle image déposée dans imgs/.
 *
 * Principe : plus un pixel est blanc, plus il devient transparent
 * (alpha = 255 - min(r,g,b)). Les traits d'encre sombres restent opaques,
 * les lavis pâles deviennent semi-transparents — ce qui préserve
 * naturellement les bords doux et diffus de l'aquarelle, sans halo ni
 * découpe nette.
 */

const cache = new Map<string, string>();

export function detourerBlanc(url: string): Promise<string> {
  const dejaFait = cache.get(url);
  if (dejaFait) return Promise.resolve(dejaFait);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(url);

        ctx.drawImage(img, 0, 0);
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const p = image.data;
        for (let i = 0; i < p.length; i += 4) {
          const blancheur = Math.min(p[i], p[i + 1], p[i + 2]);
          let a = (255 - blancheur) * 1.15;
          if (a < 14) a = 0; // efface les pixels quasi blancs résiduels
          else if (a > 255) a = 255;
          p[i + 3] = a;
        }
        ctx.putImageData(image, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) return resolve(url);
          const objectUrl = URL.createObjectURL(blob);
          cache.set(url, objectUrl);
          resolve(objectUrl);
        }, "image/png");
      } catch {
        // Canvas « teinté » (cross-origin) ou autre souci : on retombe sur
        // l'image d'origine plutôt que de casser l'affichage.
        resolve(url);
      }
    };
    img.onerror = () => reject(new Error("échec du chargement de " + url));
    img.src = url;
  });
}
