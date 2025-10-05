export const authManagement = (secret: string) =>
  fetch(import.meta.env.VITE_API_BASE_URL + "/manage", {
    method: "POST",
    body: JSON.stringify({ secret }),
  })

export const startGame = (secret: string) =>
  fetch(import.meta.env.VITE_API_BASE_URL + "/start-game", {
    method: "POST",
    body: JSON.stringify({ secret }),
  })

export const stopGame = (secret: string) =>
  fetch(import.meta.env.VITE_API_BASE_URL + "/stop-game", {
    method: "POST",
    body: JSON.stringify({ secret }),
  })

export const getTeamSizes = (secret: string): Promise<number[]> =>
  fetch(import.meta.env.VITE_API_BASE_URL + "/team-sizes", {
    method: "POST",
    body: JSON.stringify({ secret }),
  }).then((res) => res.json())
