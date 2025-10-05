import { mat4, vec3 } from "gl-matrix"
import type { GraphicsContext } from "../graphics_context.ts"
import { TeamStyles } from "../../common/common.ts"

export class EndingScreen {
  context: GraphicsContext

  constructor(context: GraphicsContext) {
    this.context = context
  }

  draw(winningTeam: number, time: number, opacity: number) {
    const gl = this.context.gl
    const shader = this.context.vertexColorProgram

    gl.useProgram(shader)
    const transform = mat4.create()
    mat4.rotateZ(transform, transform, time / 600)
    mat4.scale(transform, transform, vec3.fromValues(2.8, 2.8, 1))
    gl.uniformMatrix4fv(gl.getUniformLocation(shader, "transform"), false, transform)
    gl.uniform1f(gl.getUniformLocation(shader, "opacity"), opacity)
    gl.uniform4f(gl.getUniformLocation(shader, "color"), ...TeamStyles[winningTeam].glColor)

    this.context.quad.draw()
  }
}
