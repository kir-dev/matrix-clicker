const ShaderDivideMarker = "//--"

export const createShader = (gl: WebGL2RenderingContext, source: string): WebGLProgram => {
  console.log("Compiling Shader...")
  console.log(source)
  const [vsSource, fsSource] = source.split(ShaderDivideMarker).map((source) => source.trim())
  const vs = createShaderModule(gl, gl.VERTEX_SHADER, vsSource)
  const fs = createShaderModule(gl, gl.FRAGMENT_SHADER, fsSource)
  return createProgram(gl, vs, fs)
}

function createShaderModule(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Shader compile failed")
  }
  return shader
}

function createProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader) {
  const program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "Program link failed")
  }
  return program
}
