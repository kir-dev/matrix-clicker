import { useGameContext } from "../context/GameContext.tsx"
import { type RenderCallback, Renderer } from "../rendering/renderer.ts"
import { useEffect, useLayoutEffect, useRef } from "react"

export const useRenderer = (
  canvas?: HTMLCanvasElement | OffscreenCanvas | null,
  onRender?: RenderCallback,
) => {
  const renderer = useRef<Renderer>(null)
  const context = useGameContext()

  useEffect(() => renderer.current?.updateData(context), [context.data])

  useEffect(() => {
    renderer.current?.setOnRender(onRender)
    return () => renderer.current?.setOnRender(undefined)
  }, [onRender])

  useLayoutEffect(() => {
    if (canvas) {
      const gl: WebGL2RenderingContext | null = canvas?.getContext("webgl2", { antialias: false })
      if (!gl) throw new Error("Running this application requires webgl2")

      renderer.current = new Renderer(gl)
    }
    return () => renderer.current?.close()
  }, [canvas])
}
