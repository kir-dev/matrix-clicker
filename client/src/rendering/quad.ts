import type { GraphicsContext } from "./graphics_context.ts"

export class Quad {
  readonly context: GraphicsContext
  readonly vao: WebGLVertexArrayObject
  readonly vertices = new Float32Array([
    -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
  ])
  readonly attributePerVertex = 2

  constructor(context: GraphicsContext) {
    const gl = context.gl
    this.context = context
    this.vao = this.createVao(gl, this.vertices)
  }

  draw() {
    const gl = this.context.gl
    gl.bindVertexArray(this.vao)
    gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / this.attributePerVertex)
  }

  private createVao(gl: WebGL2RenderingContext, vertices: Float32Array): WebGLVertexArrayObject {
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    return vao
  }
}
