import gameBackgroundSource from "../shaders/game_background.glsl?raw"
import lobbyBackgroundSource from "../shaders/lobby_background.glsl?raw"
import blitSource from "../shaders/blit.glsl?raw"
import vertexColorSource from "../shaders/vertex_color.glsl?raw"
import progressBarSource from "../shaders/progress_bar.glsl?raw"
import { createShader } from "./shader.ts"
import { Quad } from "./quad.ts"

export class GraphicsContext {
  readonly gl: WebGL2RenderingContext

  readonly blitProgram: WebGLProgram
  readonly gameBackgroundProgram: WebGLProgram
  readonly lobbyBackgroundProgram: WebGLProgram
  readonly progressBarProgram: WebGLProgram
  readonly vertexColorProgram: WebGLProgram

  readonly quad: Quad

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true) // very important step
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height) // this never changes in our case

    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE) // we don't do these here. 😈

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    this.blitProgram = createShader(gl, blitSource)
    this.gameBackgroundProgram = createShader(gl, gameBackgroundSource)
    this.lobbyBackgroundProgram = createShader(gl, lobbyBackgroundSource)
    this.progressBarProgram = createShader(gl, progressBarSource)
    this.vertexColorProgram = createShader(gl, vertexColorSource)

    this.quad = new Quad(this)
  }
}
