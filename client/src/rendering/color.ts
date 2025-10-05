import { lerp } from "./util.ts"

export type GlColor = [number, number, number, number]

export const AnimationColors: GlColor[] = [
  [0.025, 0.05, 0.1, 1],
  [0.025, 0.05, 0.1, 1],
  [0.025, 0.05, 0.1, 1],
  [0.06, 0.035, 0.0125, 1],
  [0.06, 0.035, 0.0125, 1],
  [0.06, 0.035, 0.0125, 1],
  [0.035, 0.06, 0.0125, 1],
  [0.035, 0.06, 0.0125, 1],
  [0.035, 0.06, 0.0125, 1],
  [0.06, 0.06, 0.0125, 1],
  [0.06, 0.06, 0.0125, 1],
  [0.06, 0.06, 0.0125, 1],
  [0.045, 0.0225, 0.045, 1],
  [0.045, 0.0225, 0.045, 1],
  [0.045, 0.0225, 0.045, 1],
] as const

export class SolidColor {
  color: GlColor

  constructor(color: GlColor) {
    if (color.length != 4) throw Error("Color must a 4 length array")
    this.color = color
  }

  mix(other: SolidColor, t: number) {
    return new SolidColor(this.color.map((color, i) => lerp(color, other.color[i], t)) as GlColor)
  }
}
