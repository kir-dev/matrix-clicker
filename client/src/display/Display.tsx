import { useLayoutEffect, useRef } from "react"
import { useRenderer } from "./useRenderer.ts"
import { ViewportHeight, ViewportWidth } from "../rendering/constants.ts"

export const Display = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useRenderer(canvasRef.current)
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = ViewportWidth
      canvas.height = ViewportHeight
    }
  }, [canvasRef.current])

  // 'imageRendering: "pixelated"' - make rendering pixel perfect, disable all smoothing and antialiasing
  return (
    <div style={{ width: "100%", height: "100vh", background: "black" }}>
      <canvas style={{ imageRendering: "pixelated" }} ref={canvasRef}></canvas>
    </div>
  )
}
