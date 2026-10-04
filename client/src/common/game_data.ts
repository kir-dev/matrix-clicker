export type TeamId = 0 | 1 | 2 | 3

export type PlayerData = { id: string; team: TeamId }

export type TeamScore = { score: number }

export type GamePhase = "WaitingForPlayers" | "Starting" | "Playing" | "Finished"

export type GameSnapshotMessage = {
  type: "game"
  serverTime: string
  phase: GamePhase
  player: PlayerData
  teamScore: TeamScore[]
  startTime: string
  endTime: string
}

export type PongMessage = {
  type: "pong"
  clientTime: number
  serverTime: string
}

export type ServerMessage = GameSnapshotMessage | PongMessage

export type ClientMessage = { type: "cps"; cps: number } | { type: "ping"; clientTime: number }

export type GameData = GameSnapshotMessage & {
  winningTeam: number
  clockOffset: number
}

export const getServerTime = (data: GameData) => performance.now() + data.clockOffset
