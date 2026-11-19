import { useState, useEffect } from 'react'

const CELULAR = '(max-width: 900px)'

// true quando a tela é de celular (muda sozinho se a janela for redimensionada)
export function useCelular() {
  const [celular, setCelular] = useState(() => window.matchMedia(CELULAR).matches)

  useEffect(() => {
    const consulta = window.matchMedia(CELULAR)
    const mudar = () => setCelular(consulta.matches)
    consulta.addEventListener('change', mudar)
    return () => consulta.removeEventListener('change', mudar)
  }, [])

  return celular
}
