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
import type { GameData, GamePhase } from "../common/game_data.ts"

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
  const wsUrl = import.meta.env.VITE_WS_BASE_URL + "/ws"
  if (!isPlaying) {
    return wsUrl
  }

  return `${wsUrl}?playerId=${getPlayerId()}`
}

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
    let conn: WebSocket
    const connect = () => {
      conn = new WebSocket(getSocketEndpoint(isPlaying))
      console.log("connecting")
      socket.current = conn
      conn.onopen = () => {
        setIsSocketOpen(true)
      }
      conn.onclose = () => {
        setIsSocketOpen(false)
        setIsLoading(false)
        setTimeout(() => connect(), 500)
      }
      conn.onerror = (e) => {
        console.error(e)
        conn?.close()
      }
      conn.onmessage = (e: MessageEvent) => {
        setIsLoading(false)
        const data = JSON.parse(e.data) as GameData
        let winningTeam = 0
        data.teamScore.forEach((score, i) => {
          if (data.teamScore[winningTeam].score < score.score) {
            winningTeam = i
          }
        })

        setData({ ...JSON.parse(e.data), winningTeam })
      }
    }

    if (window["WebSocket"]) {
      connect()
    } else {
      setIsWebsocketSupported(false)
    }
    return () => conn?.close()
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
        if (clickedByPlayer.current === 0) return
        socket.current?.send(JSON.stringify({ cps: clickedByPlayer.current }))
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
