import type { Texture } from "../texture.ts"
import type { GraphicsContext } from "../graphics_context.ts"
import { mat4, vec3 } from "gl-matrix"

export class TextureObject {
  context: GraphicsContext

  constructor(context: GraphicsContext) {
    this.context = context
  }

  draw(texture: Texture, opacity: number = 1) {
    const gl = this.context.gl
    const shader = this.context.blitProgram

    gl.useProgram(shader)
    const transform = mat4.create()
    mat4.translate(transform, transform, vec3.fromValues(0, 0, -0.001))
    mat4.scale(transform, transform, vec3.fromValues(2, 2, 1))
    gl.uniformMatrix4fv(gl.getUniformLocation(shader, "transform"), false, transform)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture.texture)
    gl.uniform1i(gl.getUniformLocation(shader, "textureSampler"), 0)
    gl.uniform1f(gl.getUniformLocation(shader, "opacity"), opacity)

    this.context.quad.draw()
  }
}
