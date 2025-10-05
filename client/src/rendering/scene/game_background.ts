import type { GraphicsContext } from "../graphics_context.ts"
import { mat4, vec3 } from "gl-matrix"

export class GameBackground {
  readonly context: GraphicsContext

  constructor(context: GraphicsContext) {
    this.context = context
  }

  draw(time: number) {
    const gl = this.context.gl
    const shader = this.context.gameBackgroundProgram

    gl.useProgram(shader)
    gl.uniform1f(gl.getUniformLocation(shader, "time"), time / 1000)

    let transform = mat4.create()
    mat4.scale(transform, transform, vec3.fromValues(2, 2, 1))
    gl.uniformMatrix4fv(gl.getUniformLocation(shader, "transform"), false, transform)

    this.context.quad.draw()
  }
}
