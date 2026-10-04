import { CountingNumber } from "../common/CountingNumber.tsx"
import { type TeamStyle, TeamStyles } from "../common/common.ts"
import { getServerTime, type GameData } from "../common/game_data.ts"
import { Button } from "../common/Button.tsx"
import { useEffect, useRef, useState } from "react"
import { cn } from "../common/cn.ts"

export const PlayerView = ({ data, onClick }: { data: GameData; onClick: () => void }) => {
  const phase = data.phase
  const playerTeam = data.player.team
  const playerStyle = TeamStyles[playerTeam]

  if (phase === "WaitingForPlayers") {
    return <GameWaitingForPlayers playerStyle={playerStyle} />
  } else if (phase === "Starting") {
    return <GameStarting data={data} playerStyle={playerStyle} />
  } else if (phase === "Finished") {
    return <GameFinished data={data} playerTeam={playerTeam} />
  }

  return (
    <GamePlaying data={data} onClick={onClick} playerStyle={playerStyle} playerTeam={playerTeam} />
  )
}

const TeamScores = ({
  data,
  skipPlayerTeam,
  playerTeam,
}: {
  data: GameData
  skipPlayerTeam: boolean
  playerTeam: number
}) => (
  <>
    {data.teamScore
      .map((score, index) => ({ score, index }))
      .filter((team) => team.index !== playerTeam || !skipPlayerTeam)
      .map((team) => (
        <CountingNumber
          key={team.index}
          style={{ color: TeamStyles[team.index].color }}
          numberToAnimate={team.score.score}
        />
      ))}
  </>
)

const GameWaitingForPlayers = ({ playerStyle }: { playerStyle: TeamStyle }) => {
  return (
    <div className="select-none flex flex-col items-center gap-8">
      <h1
        className="px-8 pt-16 pb-4 text-2xl font-bold text-center"
        style={{ color: playerStyle.color }}
      >
        Várakozás a játékosokra...
      </h1>
      <p className="px-4 text-center font-semibold text-lg max-w-120">
        A játékban 4 csapat versenyzik, te a{" "}
        <span style={{ color: playerStyle.color }}>{playerStyle.name.toLowerCase()}</span> csapatban
        vagy. A játék alatt kattints a képernyőre a pontszerzéshez!
      </p>
      {document.documentElement.requestFullscreen && (
        <Button
          onClick={() => document.documentElement.requestFullscreen({ navigationUI: "hide" })}
        >
          Teljes Képernyő
        </Button>
      )}
    </div>
  )
}

const calcTimeLeft = (to: string, data: GameData, ceil: boolean) => {
  const timeLeft = Math.max(0, new Date(to).getTime() - getServerTime(data)) / 1000
  if (ceil) {
    return Math.ceil(timeLeft)
  }
  return Math.floor(timeLeft)
}

const GameStarting = ({ playerStyle, data }: { playerStyle: TeamStyle, data:GameData }) => {
  const startTime = data.startTime
  const latestData = useRef(data)
  latestData.current = data
  const [secondsLeft, setSecondsLeft] = useState(calcTimeLeft(startTime, data, false))

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(calcTimeLeft(startTime, latestData.current, false))
    }, 250)
    return () => clearInterval(interval)
  }, [startTime])

  return (
    <div className="select-none flex flex-col items-center gap-8">
      <h1
        className="px-8 pt-16 pb-4 text-2xl font-bold text-center"
        style={{ color: playerStyle.color }}
      >
        Készülj...
      </h1>
      <p className="px-4 text-center font-semibold text-lg max-w-120">
        A játékban 4 csapat versenyzik, te a{" "}
        <span style={{ color: playerStyle.color }}>{playerStyle.name.toLowerCase()}</span> csapatban
        vagy. A játék alatt kattints a képernyőre a pontszerzéshez!
      </p>
      <p className="px-4 text-center italic max-w-120">
        Emlékeztető: A telód tud multi touch-ot. 🤓
        <br />
        protip: Tedd az alkalmazást teljes képernyőre!
      </p>
      {document.documentElement.requestFullscreen && (
        <Button
          onClick={() => document.documentElement.requestFullscreen({ navigationUI: "hide" })}
        >
          Teljes Képernyő
        </Button>
      )}
      <div
        className={cn(
          "flex gap-2 justify-evenly text-2xl font-bold p-8 pb-16",
          secondsLeft < 5 && "animate-pulse",
        )}
      >
        {secondsLeft + 1}
      </div>
    </div>
  )
}

const GameFinished = ({ data, playerTeam }: { data: GameData; playerTeam: number }) => {
  return (
    <div className="select-none flex flex-col items-center gap-8">
      <h1
        className="px-8 pt-16 pb-4 text-2xl font-bold text-center"
        style={{ color: TeamStyles[data.winningTeam].color }}
      >
        {TeamStyles[data.winningTeam].name} csapat nyert!
      </h1>
      <div className="flex gap-4 items-center text-2xl font-bold p-4 flex-col">
        <p>Elért pontok:</p>
        <TeamScores data={data} skipPlayerTeam={false} playerTeam={playerTeam} />
      </div>
      <Button>Mégegyet!</Button>
    </div>
  )
}

function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  )
}

const GamePlaying = ({
  data,
  playerStyle,
  playerTeam,
  onClick,
}: {
  data: GameData
  playerTeam: number
  playerStyle: TeamStyle
  onClick: () => void
}) => {
  const endTime = data.endTime
  const latestData = useRef(data)
  latestData.current = data
  const [secondsLeft, setSecondsLeft] = useState(calcTimeLeft(endTime, data, false))

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(calcTimeLeft(endTime, latestData.current, false))
    }, 250)
    return () => clearInterval(interval)
  }, [endTime])

  return (
    <div
      className="flex flex-col h-full select-none"
      onTouchEnd={(_) => onClick()}
      onClick={() => {
        if (!isTouchDevice()) onClick()
      }}
    >
      <div className="flex gap-2 justify-evenly text-2xl font-bold p-8 pt-16">
        <TeamScores data={data} skipPlayerTeam={true} playerTeam={playerTeam} />
      </div>
      <div className="flex-1 flex flex-col gap-4 items-center text-4xl font-bold justify-center h-full">
        <div className="text-base italic animate-pulse">Click-Click</div>
        <CountingNumber
          style={{ color: playerStyle.color }}
          numberToAnimate={data.teamScore[playerTeam].score}
        />
      </div>
      <div
        className={cn(
          "flex gap-2 justify-evenly text-2xl font-bold p-8 pb-16",
          secondsLeft < 5 && "animate-pulse",
        )}
      >
        {secondsLeft}
      </div>
    </div>
  )
}
