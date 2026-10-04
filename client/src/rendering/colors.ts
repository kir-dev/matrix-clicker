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
      glColor: [1, 0, 0, 1.0] as GlColor, // differs from the hex code, so it's visible on the display
    },
    green: {
      color: "#7acb28ff",
      glColor: [0.192, 1, 0.18, 1] as GlColor, // differs from the hex code, so it's visible on the display
    },
    yellow: {
      color: "#cbcb28ff",
      glColor: [1, 0.918, 0, 1] as GlColor, // differs from the hex code, so it's visible on the display
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
    progressBarNoiseMix: 0.4,
    endingScreenGradientMix: 0.5,
  },
}
