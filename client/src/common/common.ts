import type { GlColor } from "../rendering/color.ts"

export type TeamStyle = { name: string; color: string; glColor: GlColor }

export const TeamStyles: TeamStyle[] = [
  { name: "Kék", color: "#397aecff", glColor: [0.2256, 0.48, 0.9264, 1] },
  { name: "Piros", color: "#cb3b28", glColor: [0.796, 0.231, 0.157, 1.0] },
  { name: "Zöld", color: "#7acb28ff", glColor: [0.48, 0.7992, 0.1596, 1] },
  { name: "Sárga", color: "#cbcb28ff", glColor: [0.7992, 0.7992, 0.1596, 1] },
]
