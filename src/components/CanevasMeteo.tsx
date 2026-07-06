import { useEffect, useRef } from "react";
import type { Saison } from "../types";
import { initMeteo } from "../lib/meteo";
import { useReduireMouvement } from "../hooks/useReduireMouvement";

interface Props {
  saison: Saison;
}

/** Neige, pollen/pétales, lucioles ou feuilles tombantes, selon la saison. */
export function CanevasMeteo({ saison }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduireMouvement = useReduireMouvement();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const arreter = initMeteo(canvas, saison, reduireMouvement);
    return arreter;
  }, [saison, reduireMouvement]);

  return <canvas id="weather-canvas" ref={ref} />;
}
