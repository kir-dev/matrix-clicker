import { AnimationColors, SolidColor } from "../color.ts"
import { mat4, vec3 } from "gl-matrix"
import type { GraphicsContext } from "../graphics_context.ts"

export class LobbyBackground {
  context: GraphicsContext

  constructor(context: GraphicsContext) {
    this.context = context
  }

  draw(time: number, opacity: number) {
    const gl = this.context.gl
    const shader = this.context.lobbyBackgroundProgram

    gl.useProgram(shader)
    gl.uniform1f(gl.getUniformLocation(shader, "time"), time / 1000)

    const color = this.getColorAnimation(time)
    gl.uniform4f(gl.getUniformLocation(shader, "color"), ...color.color)
    gl.uniform1f(gl.getUniformLocation(shader, "opacity"), opacity)

    let transform = mat4.create()
    mat4.scale(transform, transform, vec3.fromValues(4, 4, 1))
    const rotation = time / 12500
    mat4.rotateZ(transform, transform, rotation)
    gl.uniformMatrix4fv(gl.getUniformLocation(shader, "transform"), false, transform)

    this.context.quad.draw()
  }

  private getColorAnimation(time: number) {
    const scaledTime = time / 3000
    const currentIndex = Math.floor(scaledTime) % AnimationColors.length
    const currentColor = new SolidColor(AnimationColors[currentIndex])
    const nextColor = new SolidColor(AnimationColors[(currentIndex + 1) % AnimationColors.length])

    const currentColorProgress = scaledTime % 1 // gets the decimal part
    return currentColor.mix(nextColor, currentColorProgress)
  }
}
