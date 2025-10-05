import type { GraphicsContext } from "../graphics_context.ts"
import { mat4, vec3 } from "gl-matrix"
import { SolidColor } from "../color.ts"
import { TeamStyles } from "../../common/common.ts"

export type ProgressBarRenderProps = {
  animationTime: number
  gameTime: number
  startTime: number
  endTime: number
  relativeScores: number[]
}

export class ProgressBars {
  readonly context: GraphicsContext

  constructor(context: GraphicsContext) {
    this.context = context
  }

  draw({ startTime, endTime, animationTime, gameTime, relativeScores }: ProgressBarRenderProps) {
    const gl = this.context.gl
    const shader = this.context.progressBarProgram
    gl.useProgram(shader)

    const startOffset = 0.3
    const timeFromStart = gameTime / (endTime - startTime)
    const timeProgress = Math.min(Math.max(timeFromStart, 0.0) + startOffset, 1)
    const xPositions = [-0.62, -0.25, 0.25, 0.62]

    for (let i = 0; i < relativeScores.length; i++) {
      const state = relativeScores[i]
      const barProgress = Math.max(state * timeProgress, 0.025)
      gl.uniform1f(gl.getUniformLocation(shader, "barProgress"), barProgress)

      const transform = mat4.create()
      mat4.translate(transform, transform, vec3.fromValues(xPositions[i], 0, 0))
      mat4.scale(transform, transform, vec3.fromValues(0.2, 2, 1))
      gl.uniformMatrix4fv(gl.getUniformLocation(shader, "transform"), false, transform)
      gl.uniform1f(gl.getUniformLocation(shader, "time"), animationTime / 1000)
      const teamColor = new SolidColor(TeamStyles[i].glColor).color
      gl.uniform4f(gl.getUniformLocation(shader, "color"), ...teamColor)
      this.context.quad.draw()
    }
  }
}
