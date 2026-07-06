import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { CONFIG } from "../config";
import { NOM_FICHIER_SAISON, type Saison } from "../types";
import { useFondsDisponibles } from "../hooks/useFondsDisponibles";

interface Props {
  saison: Saison;
}

interface Calque {
  saison: Saison;
  url: string | null; // null => on utilise le dégradé de secours de la saison
}

/**
 * Deux calques superposés pour un fondu croisé doux entre deux saisons.
 * Si l'image réelle (winter.jpg, etc.) est absente, un dégradé aquarelle
 * de secours est utilisé à la place (voir les classes .fallback-* en CSS).
 *
 * La disponibilité des 4 fonds est vérifiée une seule fois (voir
 * useFondsDisponibles), pas à chaque changement de saison.
 */
export function FondSaison({ saison }: Props) {
  const disponibles = useFondsDisponibles();
  const dispoActuelle = disponibles[saison];

  const [calques, setCalques] = useState<[Calque | null, Calque | null]>([null, null]);
  const [actif, setActif] = useState<0 | 1>(0);
  const actifRef = useRef<0 | 1>(0);

  useEffect(() => {
    if (dispoActuelle === undefined) return; // vérification pas encore terminée
    const nomFichier = NOM_FICHIER_SAISON[saison];
    const url = dispoActuelle
      ? `${import.meta.env.BASE_URL}${CONFIG.DOSSIER_FONDS}/${nomFichier}.jpg`
      : null;
    const nouveauCalque: Calque = { saison, url };

    setCalques((precedent) => {
      const estPremier = precedent[0] === null && precedent[1] === null;
      const cible = estPremier ? 0 : actifRef.current === 0 ? 1 : 0;
      const suivant: [Calque | null, Calque | null] = [...precedent];
      suivant[cible] = nouveauCalque;
      actifRef.current = cible;
      setActif(cible);
      return suivant;
    });
  }, [saison, dispoActuelle]);

  function style(calque: Calque | null, estActif: boolean): CSSProperties {
    if (!calque) return { opacity: 0 };
    return {
      backgroundImage: calque.url ? `url("${calque.url}")` : undefined,
      opacity: estActif ? 1 : 0,
    };
  }

  function classe(calque: Calque | null): string {
    if (!calque || calque.url) return "bg-layer";
    return `bg-layer fallback-${NOM_FICHIER_SAISON[calque.saison]}`;
  }

  return (
    <>
      <div className={classe(calques[0])} style={style(calques[0], actif === 0)} />
      <div className={classe(calques[1])} style={style(calques[1], actif === 1)} />
    </>
  );
}
