export type GlColor = [number, number, number, number]
export type GlRgb = [number, number, number]

// Display palette and color-specific shader controls. Keep each team's CSS and WebGL values paired.
export const DisplayColors = {
  background: {
    css: "#000000",
    gl: [0, 0, 0, 1] as GlColor,
  },
  teams: {
    blue: {
      color: "#397aecff",
      glColor: [0.2256, 0.48, 0.9264, 1] as GlColor,
    },
    red: {
      color: "#cb3b28",
      glColor: [0.796, 0.231, 0.157, 1.0] as GlColor,
    },
    green: {
      color: "#7acb28ff",
      glColor: [0.48, 0.7992, 0.1596, 1] as GlColor,
    },
    yellow: {
      color: "#cbcb28ff",
      glColor: [0.7992, 0.7992, 0.1596, 1] as GlColor,
    },
  },
  lobbyAnimation: [
    [0.025, 0.05, 0.1, 1],
    [0.025, 0.05, 0.1, 1],
    [0.025, 0.05, 0.1, 1],
    [0.06, 0.035, 0.0125, 1],
    [0.06, 0.035, 0.0125, 1],
    [0.06, 0.035, 0.0125, 1],
    [0.035, 0.06, 0.0125, 1],
    [0.035, 0.06, 0.0125, 1],
    [0.035, 0.06, 0.0125, 1],
    [0.06, 0.06, 0.0125, 1],
    [0.06, 0.06, 0.0125, 1],
    [0.06, 0.06, 0.0125, 1],
    [0.045, 0.0225, 0.045, 1],
    [0.045, 0.0225, 0.045, 1],
    [0.045, 0.0225, 0.045, 1],
  ] as GlColor[],
  shader: {
    gameBackground: {
      tint: [0.3, 0.3, 0.3] as GlRgb,
      channelAmplitude: [0.5, 0.5, 0.2] as GlRgb,
      channelOffset: [0.5, 0.5, 0.5] as GlRgb,
    },
    lobbyBackground: {
      intensity: 1.5,
      colorCeiling: [1, 1, 1] as GlRgb,
    },
    progressBarNoiseMix: 0.2,
    endingScreenGradientMix: 0.35,
  },
}
