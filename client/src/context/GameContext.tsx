import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type RefObject,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type {
  ClientMessage,
  GameData,
  GamePhase,
  GameSnapshotMessage,
  PongMessage,
  ServerMessage,
} from "../common/game_data.ts"
import { ClockSync } from "../common/clock_sync.ts"

const PingBurstCount = 4
const PingBurstIntervalMs = 250
const PingIntervalMs = 5000

export type GameContextData = {
  isWebsocketSupported: boolean
  isSocketOpen: boolean
  isLoading: boolean
  click: () => void
  data?: GameData
}

const GameContext = createContext<GameContextData>({
  isWebsocketSupported: true,
  isSocketOpen: false,
  isLoading: true,
  click: () => {},
})

const getPlayerId = () => {
  const playerIdKey = "playerId"
  const existingId = localStorage.getItem(playerIdKey)
  if (existingId) return existingId

  const generatedId = crypto.randomUUID()
  localStorage.setItem(playerIdKey, generatedId)
  return generatedId
}

const getSocketEndpoint = (isPlaying: boolean): string => {
  const wsUrl = window.config.WS_BASE_URL + "/ws"
  if (!isPlaying) {
    return wsUrl
  }

  return `${wsUrl}?playerId=${getPlayerId()}`
}

const send = (socket: WebSocket, message: ClientMessage) => socket.send(JSON.stringify(message))

export const useGameContext = () => useContext(GameContext)

function useWebsocket(
  socket: RefObject<WebSocket | null>,
  isPlaying: boolean,
  setIsSocketOpen: Dispatch<SetStateAction<boolean>>,
  setIsLoading: Dispatch<SetStateAction<boolean>>,
  setData: Dispatch<SetStateAction<GameData | undefined>>,
  setIsWebsocketSupported: Dispatch<SetStateAction<boolean>>,
) {
  useEffect(() => {
    let conn: WebSocket | undefined
    let reconnectTimeout: number | undefined
    let pingTimeout: number | undefined
    let reconnectAttempts = 0
    let disposed = false
    const clockSync = new ClockSync()

    const onSnapshot = (message: GameSnapshotMessage, receivedAt: number) => {
      setIsLoading(false)
      let winningTeam = 0
      message.teamScore.forEach((score, i) => {
        if (message.teamScore[winningTeam].score < score.score) {
          winningTeam = i
        }
      })

      // Until the first pong lands, fall back to the one-way estimate (assumes zero latency).
      const clockOffset = clockSync.offset ?? new Date(message.serverTime).getTime() - receivedAt
      setData({ ...message, winningTeam, clockOffset })
    }

    const onPong = (message: PongMessage, receivedAt: number) => {
      const serverTime = new Date(message.serverTime).getTime()
      const clockOffset = clockSync.addRoundTrip(message.clientTime, receivedAt, serverTime)
      setData((d) => (d === undefined || d.clockOffset === clockOffset ? d : { ...d, clockOffset }))
    }

    const connect = () => {
      if (disposed) return
      const ws = new WebSocket(getSocketEndpoint(isPlaying))
      console.log("connecting")
      conn = ws
      socket.current = ws

      let pingsSent = 0
      const ping = () => {
        if (disposed || ws.readyState !== WebSocket.OPEN) return
        send(ws, { type: "ping", clientTime: performance.now() })
        pingsSent++
        const delay = pingsSent < PingBurstCount ? PingBurstIntervalMs : PingIntervalMs
        pingTimeout = window.setTimeout(ping, delay)
      }

      ws.onopen = () => {
        if (disposed) return
        reconnectAttempts = 0
        setIsSocketOpen(true)
        ping()
      }
      ws.onclose = () => {
        if (disposed) return
        window.clearTimeout(pingTimeout)
        setIsSocketOpen(false)
        setIsLoading(false)
        const maxDelay = Math.min(500 * 2 ** reconnectAttempts, 2000)
        reconnectAttempts = Math.min(reconnectAttempts + 1, 2)
        reconnectTimeout = window.setTimeout(connect, Math.random() * maxDelay)
      }
      ws.onerror = (e) => {
        if (disposed) return
        console.error(e)
        ws.close()
      }
      ws.onmessage = (e: MessageEvent) => {
        if (disposed) return
        const receivedAt = performance.now()
        const message = JSON.parse(e.data) as ServerMessage
        switch (message.type) {
          case "game":
            onSnapshot(message, receivedAt)
            break
          case "pong":
            onPong(message, receivedAt)
            break
          default:
            console.warn("unknown server message", message)
        }
      }
    }

    if (window["WebSocket"]) {
      connect()
    } else {
      setIsWebsocketSupported(false)
    }
    return () => {
      disposed = true
      if (reconnectTimeout !== undefined) window.clearTimeout(reconnectTimeout)
      if (pingTimeout !== undefined) window.clearTimeout(pingTimeout)
      conn?.close()
    }
  }, [])
}

function useBatchedUpdate(
  isPlaying: boolean,
  data: GameData | undefined,
  socket: RefObject<WebSocket | null>,
  clickedByPlayer: RefObject<number>,
) {
  const stage = data?.phase
  useEffect(() => {
    if (stage !== "Playing") {
      clickedByPlayer.current = 0
    }
  }, [stage])

  useEffect(() => {
    if (!isPlaying || stage != "Playing") return
    let timeout: number | undefined
    const interval = setInterval(() => {
      timeout = setTimeout(() => {
        if (clickedByPlayer.current === 0 || !socket.current) return
        send(socket.current, { type: "cps", cps: clickedByPlayer.current })
        clickedByPlayer.current = 0
      }, Math.random() * 50)
    }, 100)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [stage])
}

function useBatchedClickCallback(
  stage: GamePhase | undefined,
  isPlaying: boolean,
  clickedByPlayer: RefObject<number>,
  setData: (value: (prevState: GameData | undefined) => GameData | undefined) => void,
  socket: RefObject<WebSocket | null>,
) {
  return useCallback(() => {
    // Most of the logic here is for optimistic update
    if (stage === "Finished" || !isPlaying) return
    const clickedAmount = 1
    clickedByPlayer.current += clickedAmount
    setData((d) => {
      if (!d) return undefined
      const teamScore = [...d.teamScore]
      teamScore[d.player.team] = { score: teamScore[d.player.team].score + clickedAmount }
      return { ...d, teamScore }
    })
  }, [socket.current, stage])
}

export const GameContextProvider = ({
  isPlaying,
  children,
}: PropsWithChildren & { isPlaying: boolean }) => {
  const [isWebsocketSupported, setIsWebsocketSupported] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSocketOpen, setIsSocketOpen] = useState(false)
  const [data, setData] = useState<GameData>()

  const clickedByPlayer = useRef(0)
  const socket = useRef<WebSocket>(null)

  useWebsocket(socket, isPlaying, setIsSocketOpen, setIsLoading, setData, setIsWebsocketSupported)
  useBatchedUpdate(isPlaying, data, socket, clickedByPlayer)

  const stage = data?.phase
  const click = useBatchedClickCallback(stage, isPlaying, clickedByPlayer, setData, socket)

  const context = useMemo(
    () => ({ isWebsocketSupported, isSocketOpen, isLoading, click, data }),
    [isWebsocketSupported, isSocketOpen, isLoading, click, data],
  )
  return <GameContext.Provider value={context}>{children}</GameContext.Provider>
}
