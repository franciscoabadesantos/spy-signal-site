export const scrollMotionTokens = {
  engine: {
    lerp: 0.1,
  },
  scrub: {
    tight: 0.35,
    standard: 0.8,
    cinematic: 1,
  },
  depth: {
    far: 0.12,
    middle: 0.3,
    near: 0.58,
  },
  homepage: {
    pinDistance: 3200,
    visibilityDistance: 3400,
  },
} as const

export type ScrollExperienceProfile = 'narrative' | 'standard' | 'operational'
