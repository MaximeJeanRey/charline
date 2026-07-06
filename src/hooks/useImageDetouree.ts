import { useEffect, useState } from "react";
import { detourerBlanc } from "../lib/detourage";

/**
 * Renvoie l'URL de l'illustration une fois son fond blanc détouré
 * (transparent), ou `null` tant que le traitement est en cours.
 * En cas d'échec, retombe sur l'URL d'origine.
 */
export function useImageDetouree(url: string): string | null {
  const [detouree, setDetouree] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    setDetouree(null);
    detourerBlanc(url)
      .then((u) => {
        if (!annule) setDetouree(u);
      })
      .catch(() => {
        if (!annule) setDetouree(url);
      });
    return () => {
      annule = true;
    };
  }, [url]);

  return detouree;
}
