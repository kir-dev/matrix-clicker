import { createRoot } from "react-dom/client"
import "./index.css"
import { BrowserRouter, Route, Routes } from "react-router"
import { GameContextProvider } from "./context/GameContext.tsx"
import { Display } from "./display/Display.tsx"
import { PlayerViewWithLoading } from "./player/PlayerViewWithLoading.tsx"
import { DisplayWithPreview } from "./display/DisplayWithPreview.tsx"
import { GameManagement } from "./management/GameManagement.tsx"

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route
        index
        element={
          <GameContextProvider isPlaying={true}>
            <PlayerViewWithLoading />
          </GameContextProvider>
        }
      />
      <Route
        path="/display"
        element={
          <GameContextProvider isPlaying={false}>
            <Display />
          </GameContextProvider>
        }
      />
      <Route
        path="/preview"
        element={
          <GameContextProvider isPlaying={false}>
            <DisplayWithPreview />
          </GameContextProvider>
        }
      />
      <Route
        path="/management"
        element={
          <GameContextProvider isPlaying={false}>
            <GameManagement />
          </GameContextProvider>
        }
      />
    </Routes>
  </BrowserRouter>,
)
