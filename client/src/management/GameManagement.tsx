import { useGameContext } from "../context/GameContext.tsx"
import { LoadingIndicator } from "../common/LoadingIndicator.tsx"
import { Button } from "../common/Button.tsx"
import { getTeamSizes, startGame, stopGame } from "./requests.ts"
import { type FC, type MouseEventHandler, type PropsWithChildren, useEffect, useState } from "react"
import { ManagementLogin } from "./ManagementLogin.tsx"
import { TeamStyles } from "../common/common.ts"

export const GameManagement = () => {
  const [secret, setSecret] = useState("")

  return (
    <div className="p-4">
      <h1 className="font-bold text-5xl">Mátrix clicker management</h1>
      {!secret && <ManagementLogin setSecret={setSecret} />}
      {secret && <GameManagementPage secret={secret} />}
    </div>
  )
}

const GameManagementPage = ({ secret }: { secret: string }) => {
  const { isLoading, data } = useGameContext()

  if (isLoading || !data)
    return (
      <div className="w-full h-full flex items-center justify-center py-4">
        <LoadingIndicator />
      </div>
    )

  return (
    <>
      <div className="flex gap-4 py-4">
        <ButtonWithConfirmation onClick={() => startGame(secret)}>
          Játék újraindítása
        </ButtonWithConfirmation>
        <ButtonWithConfirmation onClick={() => stopGame(secret)}>
          Játék leállítása
        </ButtonWithConfirmation>
      </div>
      <div className="text-2xl font-bold py-4">{data.phase}</div>
      <TeamSizes secret={secret} />
      <div className="flex flex-row gap-4 text-2xl font-bold py-4">
        <span className="min-w-36">Pontszámok:</span>
        {data.teamScore.map((score, i) => (
          <div style={{ color: TeamStyles[i].color }} className="min-w-28">
            {score.score}
          </div>
        ))}
      </div>
    </>
  )
}

const TeamSizes = ({ secret }: { secret: string }) => {
  const [sizes, setSizes] = useState<number[]>()

  useEffect(() => {
    const interval = setInterval(() => getTeamSizes(secret).then(setSizes), 1000)
    return () => clearInterval(interval)
  }, [secret])

  if (!sizes) return null

  return (
    <div className="flex flex-row gap-4 text-2xl font-bold py-4">
      <span className="min-w-36">Létszám:</span>
      {sizes.map((size, i) => (
        <div style={{ color: TeamStyles[i].color }} className="min-w-28">
          {size}
        </div>
      ))}
    </div>
  )
}

const ButtonWithConfirmation: FC<
  PropsWithChildren & { onClick: MouseEventHandler<HTMLButtonElement> }
> = ({ onClick, children }) => {
  const [needsConfirmation, setNeedsConfirmation] = useState(true)
  return (
    <Button
      onClick={(e) => {
        if (!needsConfirmation) {
          onClick(e)
        }
        setNeedsConfirmation(!needsConfirmation)
      }}
    >
      {needsConfirmation ? null : "Biztos?"} {children}
    </Button>
  )
}
