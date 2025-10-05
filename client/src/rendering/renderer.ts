import type { GameContextData } from "../context/GameContext.tsx"
import { GraphicsContext } from "./graphics_context.ts"
import { Scene } from "./scene/scene.ts"

export type RenderCallback = (context: GraphicsContext) => void

export class Renderer {
  readonly context: GraphicsContext
  readonly abortController: AbortController
  readonly scene: Scene
  onRenderCallback?: RenderCallback

  constructor(gl: WebGL2RenderingContext) {
    this.abortController = new AbortController()
    this.context = new GraphicsContext(gl)
    this.scene = new Scene(this.context)

    requestAnimationFrame(this.drawLoop.bind(this))
  }

  setOnRender(callback?: RenderCallback) {
    this.onRenderCallback = callback
  }

  updateData(data: GameContextData) {
    this.scene.updateData(data)
  }

  close() {
    this.abortController.abort()
  }

  private draw(animationTime: DOMHighResTimeStamp) {
    this.scene.draw(this.context, animationTime)
  }

  private update(time: DOMHighResTimeStamp) {
    this.scene.update(time)
  }

  private drawLoop(time: DOMHighResTimeStamp) {
    if (this.abortController.signal.aborted) {
      return
    }

    if (this.context.gl != null) {
      this.update(time)
      this.draw(time)
      this.onRenderCallback?.(this.context)
    }

    requestAnimationFrame(this.drawLoop.bind(this))
  }
}
