import { Countdown } from "./countdown.ts"
import { LobbyBackground } from "./lobby_background.ts"
import { EndingScreen } from "./ending_screen.ts"
import type { GraphicsContext } from "../graphics_context.ts"
import type { GameContextData } from "../../context/GameContext.tsx"
import type { GamePhase } from "../../common/game_data.ts"
import { lerp } from "../util.ts"
import { GameBackground } from "./game_background.ts"
import { ProgressBars } from "./progress_bars.ts"

const baseScore = [0, 0, 0, 0]

export class Scene {
  readonly countdown: Countdown
  readonly lobbyBackground: LobbyBackground
  readonly gameBackground: GameBackground
  readonly progressBars: ProgressBars
  readonly endingScreen: EndingScreen

  startTime = new Date().getTime()
  endtime = this.startTime + 100000
  relativeTeamScores = baseScore
  displayedScores = baseScore
  phase: GamePhase = "WaitingForPlayers"
  winningTeam = 0

  lastFrameTime = 0

  constructor(context: GraphicsContext) {
    this.countdown = new Countdown(context)
    this.lobbyBackground = new LobbyBackground(context)
    this.gameBackground = new GameBackground(context)
    this.progressBars = new ProgressBars(context)
    this.endingScreen = new EndingScreen(context)
  }

  updateData(data: GameContextData) {
    const gameData = data.data
    if (!gameData) return
    if (gameData.phase != "Playing" && gameData.phase != "Finished") {
      this.displayedScores = baseScore
    }

    this.phase = gameData.phase
    const teamScores = gameData.teamScore.map((teamScore) => teamScore.score)
    const maxScore = teamScores.reduceRight((a, b) => Math.max(a, b), 0.01)

    this.relativeTeamScores = teamScores.map((score) => score / maxScore)
    this.winningTeam = gameData.winningTeam
    this.startTime = new Date(gameData.startTime).getTime()
    this.endtime = new Date(gameData.endTime).getTime()
  }

  draw(context: GraphicsContext, animationTime: DOMHighResTimeStamp) {
    const gl = context.gl
    const gameTime = new Date().getTime() - this.startTime
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    this.drawGame(animationTime, gameTime)
    if (this.phase == "Starting" || this.phase == "WaitingForPlayers") {
      this.drawLobby(animationTime, gameTime)
    }
  }

  update(animationTime: DOMHighResTimeStamp) {
    const deltaTime = Math.max(animationTime - this.lastFrameTime, 0) / 1000
    this.lastFrameTime = animationTime
    if (deltaTime <= 0) return

    this.interpolateDisplayedScores(deltaTime)
  }

  private interpolateDisplayedScores(dt: number) {
    this.displayedScores = this.displayedScores.map((_, i) => {
      const displayedScore = this.displayedScores[i]
      const desiredScore = this.relativeTeamScores[i]

      const from = Math.min(displayedScore, desiredScore)
      const to = Math.max(displayedScore, desiredScore)
      const difference = desiredScore - displayedScore

      const newScore = this.displayedScores[i] + difference * dt
      if (isNaN(newScore)) return desiredScore
      return Math.max(Math.min(newScore, to), from)
    })
  }

  private drawLobby(animationTime: number, gameTime: number) {
    const timeUntilStart = -gameTime / 1000
    const secondsUntilStart = Math.floor(timeUntilStart)
    const transitionAnimationProgress = timeUntilStart % 1

    const shouldDimBackground = this.phase == "Starting" && timeUntilStart < 10
    const dimProgress = 1 - Math.max(0, Math.min(1, (timeUntilStart - 5) / 2))
    const backgroundOpacity = shouldDimBackground ? lerp(1, 0.3, dimProgress) : 1

    this.lobbyBackground.draw(animationTime, backgroundOpacity)
    this.countdown.draw(secondsUntilStart, transitionAnimationProgress)
  }

  private drawGame(animationTime: number, gameTime: number) {
    this.gameBackground.draw(animationTime)
    this.progressBars.draw({
      animationTime,
      gameTime,
      startTime: this.startTime,
      endTime: this.endtime,
      relativeScores: this.displayedScores,
    })

    // Draw the ending screen on top, if in that stage
    const timeUntilEnd = (this.endtime - this.startTime - gameTime) / 1000
    const shouldRevealEndingScreen = this.phase == "Finished" && timeUntilEnd < 0
    const revealProgress = Math.max(0, Math.min(1, -timeUntilEnd / 4))
    const endingScreenOpacity = shouldRevealEndingScreen ? revealProgress : 0
    this.endingScreen.draw(this.winningTeam, animationTime, endingScreenOpacity)
  }
}
