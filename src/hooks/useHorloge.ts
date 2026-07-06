import { useEffect, useState } from "react";

/**
 * Fournit la date actuelle, rafraîchie périodiquement.
 * Permet à l'expérience de suivre le jour/la saison si l'onglet reste
 * ouvert longtemps, sans jamais recharger la page.
 */
export function useHorloge(intervalleMs = 30 * 60 * 1000): Date {
  const [maintenant, setMaintenant] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setMaintenant(new Date()), intervalleMs);
    return () => window.clearInterval(id);
  }, [intervalleMs]);

  return maintenant;
}
