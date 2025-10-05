export type TeamId = 0 | 1 | 2 | 3

export type PlayerData = { id: string; team: TeamId }

export type TeamScore = { score: number }

export type GamePhase = "WaitingForPlayers" | "Starting" | "Playing" | "Finished"

export type GameData = {
  phase: GamePhase
  player: PlayerData
  teamScore: TeamScore[]
  startTime: string
  endTime: string
  winningTeam: number
}
