import { makePreferences } from "../preferences/preferences"

export type CollageEditorPreferences = {
  readonly leftMenuWidth: number
  readonly middlePercent: number
  readonly topPercent: number
}

const defaultPreferences: CollageEditorPreferences = {
  leftMenuWidth: 128,
  middlePercent: 70,
  topPercent: 70,
}

export const collageEditorPreferences = makePreferences<CollageEditorPreferences>(
  "editor-prefs:collage:",
  defaultPreferences,
)
