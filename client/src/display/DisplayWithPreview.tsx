import { useCallback, useMemo, useState } from "react"
import { ViewportHeight, ViewportWidth } from "../rendering//constants.ts"
import { useRenderer } from "./useRenderer.ts"
import type { RenderCallback } from "../rendering/renderer.ts"
import type { GraphicsContext } from "../rendering/graphics_context.ts"
import maskImage from "../assets/mask.png"

type PixelProps = {
  pixels: Uint8Array
  x: number
  y: number
  spacing?: number
  spacingBetween?: number
}

export const DisplayWithPreview = () => {
  const [pixels, setPixels] = useState(new Uint8Array())
  const renderCallback = useCallback((context: GraphicsContext) => {
    const gl = context.gl
    const newPixels = new Uint8Array(ViewportWidth * ViewportHeight * 4)
    gl.readPixels(0, 0, ViewportWidth, ViewportHeight, gl.RGBA, gl.UNSIGNED_BYTE, newPixels)
    setPixels(newPixels)
  }, [])
  return (
    <>
      <Renderer renderCallback={renderCallback} />
      <img style={{ minHeight: 1080, minWidth: 1920 }} className="absolute" src={maskImage} />
      <div style={{ height: 1080, width: 1920, paddingLeft: 753.2, paddingTop: 155.1 }}>
        <div className="flex flex-col h-full">
          {Array.from({ length: ViewportHeight / 2 }).map((_, y) => (
            <WindowRow key={y} pixels={pixels} y={y} />
          ))}
        </div>
      </div>
    </>
  )
}

const Renderer = ({ renderCallback }: { renderCallback: RenderCallback }) => {
  const canvas = useMemo(() => new OffscreenCanvas(ViewportWidth, ViewportHeight), [])

  useRenderer(canvas, renderCallback)
  return null
}

const WindowRow = ({ pixels, y }: { pixels: Uint8Array; y: number }) => {
  return (
    <div style={{ display: "flex", flexDirection: "row", marginBottom: 22.1 }}>
      <WindowPair pixels={pixels} x={0} y={y} spacing={8.5} spacingBetween={3} />
      <WindowPair pixels={pixels} x={2} y={y} spacing={7.5} spacingBetween={3} />
      <WindowPair pixels={pixels} x={4} y={y} spacing={8.5} spacingBetween={3.5} />
      <WindowPair pixels={pixels} x={6} y={y} spacing={10.5} spacingBetween={2.5} />
      <WindowPair pixels={pixels} x={8} y={y} spacing={8} spacingBetween={2} />
      <WindowPair pixels={pixels} x={10} y={y} spacing={7.5} spacingBetween={3.5} />
      <WindowPair pixels={pixels} x={12} y={y} spacing={8.5} spacingBetween={3} />
      <WindowPair pixels={pixels} x={14} y={y} spacing={8.5} spacingBetween={3.5} />
    </div>
  )
}

const WindowPair = ({ pixels, x, y, spacing, spacingBetween }: PixelProps) => (
  <>
    <Window pixels={pixels} x={x} y={y} spacing={spacingBetween} />
    <Window pixels={pixels} x={x + 1} y={y} spacing={spacing} />
  </>
)

const Window = ({ pixels, x, y, spacing }: PixelProps) => (
  <div
    style={{
      marginRight: spacing,
      width: 22,
      height: 22,
      background: `conic-gradient(
      ${getColorFromPixelsAt(pixels, x * 2 + 1, y * 2)} 0% 25%,
      ${getColorFromPixelsAt(pixels, x * 2 + 1, y * 2 + 1)} 25% 50%,
      ${getColorFromPixelsAt(pixels, x * 2, y * 2 + 1)} 50% 75%,
      ${getColorFromPixelsAt(pixels, x * 2, y * 2)} 75% 100%
    )`,
    }}
  ></div>
)

function getColorFromPixelsAt(pixels: Uint8Array, x: number, y: number) {
  if (!pixels.length) return "#000"
  const row = (ViewportHeight - y - 1) * ViewportWidth // WebGL textures are upside down
  const index = row + x
  return (
    "#" +
    Array.from(pixels.slice(index * 4, index * 4 + 3))
      .map((i) => i.toString(16).padStart(2, "0"))
      .join("")
  )
}
