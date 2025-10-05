import { useGameContext } from "../context/GameContext.tsx"
import { LoadingIndicator } from "../common/LoadingIndicator.tsx"
import { Button } from "../common/Button.tsx"
import { PlayerView } from "./PlayerView.tsx"
import kirDevLogo from "../assets/kirdev.svg"

export const PlayerViewWithLoading = () => {
  const { isWebsocketSupported, isLoading, isSocketOpen, data, click } = useGameContext()
  if (!isWebsocketSupported) {
    return (
      <h1 className="p-8 text-2xl font-bold text-center">
        A böngésződ nem támogatja a WebSocketeket :(
      </h1>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full select-none">
        <img alt="Kir-Dev" className="w-48 m-8" src={kirDevLogo} />
        <LoadingIndicator />
      </div>
    )
  }

  if (!isSocketOpen) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="p-8 text-2xl font-bold">Megszakadt a kapcsolat</h1>
        <Button className="px-8" onClick={() => window.location.reload()}>
          Újra
        </Button>
      </div>
    )
  }

  return <PlayerView data={data} onClick={click} />
}
