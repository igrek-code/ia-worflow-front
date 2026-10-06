import { useEffect, useRef } from 'react'

/**
 * Exécute `fn` à intervalle régulier tant que `active` est vrai.
 * `fn` est gardée à jour via une ref (pas de redémarrage du timer à chaque rendu)
 * et l'intervalle est annulé dès que `active` passe à false ou au démontage.
 */
export function usePolling(fn: () => void | Promise<void>, active: boolean, intervalMs = 2000) {
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => void fnRef.current(), intervalMs)
    return () => window.clearInterval(timer)
  }, [active, intervalMs])
}
