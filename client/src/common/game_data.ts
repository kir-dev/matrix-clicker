export type TeamId = 0 | 1 | 2 | 3

export type PlayerData = { id: string; team: TeamId }

export type TeamScore = { score: number }

export type GamePhase = "WaitingForPlayers" | "Starting" | "Playing" | "Finished"

export type GameData = {
  serverTime: string
  receivedAt: number
  phase: GamePhase
  player: PlayerData
  teamScore: TeamScore[]
  startTime: string
  endTime: string
  winningTeam: number
}

export const getServerTime = (data: GameData) =>
  new Date(data.serverTime).getTime() + performance.now() - data.receivedAt
