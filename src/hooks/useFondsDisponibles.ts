import { useEffect, useState } from "react";
import { CONFIG } from "../config";
import { NOM_FICHIER_SAISON, type Saison } from "../types";

/**
 * Vérifie UNE SEULE FOIS, au montage, quels fonds de saison réels existent
 * dans /public/assets/backgrounds — plutôt que de refaire ce test à chaque
 * changement de saison, ce qui provoquerait un clignotement du fond.
 *
 * Une saison absente de l'objet retourné signifie "vérification en cours".
 */
export function useFondsDisponibles(): Partial<Record<Saison, boolean>> {
  const [disponibles, setDisponibles] = useState<Partial<Record<Saison, boolean>>>({});

  useEffect(() => {
    let annule = false;
    (Object.keys(NOM_FICHIER_SAISON) as Saison[]).forEach((saison) => {
      const url = `${import.meta.env.BASE_URL}${CONFIG.DOSSIER_FONDS}/${NOM_FICHIER_SAISON[saison]}.jpg`;
      const img = new Image();
      img.onload = () => {
        if (!annule) setDisponibles((d) => ({ ...d, [saison]: true }));
      };
      img.onerror = () => {
        if (!annule) setDisponibles((d) => ({ ...d, [saison]: false }));
      };
      img.src = url;
    });
    return () => {
      annule = true;
    };
  }, []);

  return disponibles;
}
