import { DisplayColors, type GlColor } from "../rendering/colors.ts"

export type TeamStyle = { name: string; color: string; glColor: GlColor }

export const TeamStyles: TeamStyle[] = [
  { name: "Kék", ...DisplayColors.teams.blue },
  { name: "Piros", ...DisplayColors.teams.red },
  { name: "Zöld", ...DisplayColors.teams.green },
  { name: "Sárga", ...DisplayColors.teams.yellow },
]
