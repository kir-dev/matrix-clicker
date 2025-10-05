import type { GraphicsContext } from "../graphics_context.ts"
import { TextureObject } from "./texture_object.ts"
import { Texture } from "../texture.ts"
import image1Source from "../../assets/1.png?inline"
import image2Source from "../../assets/2.png?inline"
import image3Source from "../../assets/3.png?inline"
import image4Source from "../../assets/4.png?inline"
import image5Source from "../../assets/5.png?inline"
import imageKirDevSource from "../../assets/kirdev.png?inline"

export class Countdown {
  readonly texture: TextureObject
  readonly context: GraphicsContext

  readonly image1: Texture
  readonly image2: Texture
  readonly image3: Texture
  readonly image4: Texture
  readonly image5: Texture
  readonly imageKirDev: Texture

  constructor(context: GraphicsContext) {
    this.context = context
    const gl = context.gl

    this.image1 = new Texture(gl, image1Source)
    this.image2 = new Texture(gl, image2Source)
    this.image3 = new Texture(gl, image3Source)
    this.image4 = new Texture(gl, image4Source)
    this.image5 = new Texture(gl, image5Source)
    this.imageKirDev = new Texture(gl, imageKirDevSource)

    this.texture = new TextureObject(context)
  }

  draw(secondsUntilStart: number, transitionAnimationProgress: number) {
    const textureToDraw = this.getTextureToDraw(secondsUntilStart)
    if (textureToDraw !== undefined) {
      this.texture.draw(textureToDraw, transitionAnimationProgress)
    }
  }

  private getTextureToDraw(secondsUntilStart: number) {
    switch (secondsUntilStart) {
      case 4:
        return this.image5
      case 3:
        return this.image4
      case 2:
        return this.image3
      case 1:
        return this.image2
      case 0:
        return this.imageKirDev
    }
    return undefined
  }
}
