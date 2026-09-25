import { lerp } from "./util.ts"
import type { GlColor } from "./colors.ts"

export type { GlColor } from "./colors.ts"

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
