import { useEffect, useState } from "react";

/** Respecte la préférence système "réduire les animations". */
export function useReduireMouvement(): boolean {
  const [reduire, setReduire] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduire(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduire;
}
