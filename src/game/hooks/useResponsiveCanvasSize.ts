import { useState, useEffect } from 'react'
import { WIDTH, HEIGHT } from '../constants/dimensions' // Import der Basis-Konstanten

// Berechne das Seitenverhältnis einmalig
const ASPECT_RATIO = WIDTH / HEIGHT // 1.777...

// Hilfs-Hook zur Verfolgung der Fenstergröße
function useWindowSize() {
  // Verwendet 99% der Fenstergröße, um Platz für Ränder und Browser-UI zu lassen
  const [size, setSize] = useState({
    width: window.innerWidth * 0.99,
    height: window.innerHeight * 0.99,
  })

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth * 0.99,
        height: window.innerHeight * 0.99,
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

export function useResponsiveCanvasSize() {
  const windowSize = useWindowSize()

  const windowAspect = windowSize.width / windowSize.height

  let responsiveWidth: number
  let responsiveHeight: number

  if (windowAspect > ASPECT_RATIO) {
    // Fenster ist breiter als 16:9, Höhe ist der limitierende Faktor
    responsiveHeight = windowSize.height
    responsiveWidth = responsiveHeight * ASPECT_RATIO
  } else {
    // Fenster ist schmaler/höher als 16:9, Breite ist der limitierende Faktor
    responsiveWidth = windowSize.width
    responsiveHeight = responsiveWidth / ASPECT_RATIO
  }

  // Return gerundete Integer-Werte für das äußere Div
  return {
    canvasWidth: Math.floor(responsiveWidth),
    canvasHeight: Math.floor(responsiveHeight),
    baseWidth: WIDTH,
    baseHeight: HEIGHT,
  }
}
