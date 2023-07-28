import { TraceType, TraceTypeType } from "engine/world/level/trace/trace-type"
import { createContext } from "preact"
import { makePreferences } from "../preferences/preferences"

export type CollageEditorPreferences = {
  readonly leftMenuWidth: number
  readonly middlePercent: number
  readonly topPercent: number

  readonly traceType: TraceTypeType
  readonly frameSelected: string | null
  readonly montageSelected: string | null
  readonly montageFrameSelected: string | null
  readonly propertiesPanel: "collage" | {
    readonly type: "frame" | "montage" | "body" | "montage-frame" | "trace"
    readonly id: string
  } | null
}

const defaultPreferences: CollageEditorPreferences = {
  leftMenuWidth: 128,
  middlePercent: 70,
  topPercent: 70,
  traceType: TraceType.SOLID,
  frameSelected: null,
  montageSelected: null,
  montageFrameSelected: null,
  propertiesPanel: "collage",
}

export const collageEditorPreferences = makePreferences<CollageEditorPreferences>(
  "editor-prefs:collage:",
  defaultPreferences,
)

export type CollageEditorPreferencesPair = ReturnType<(typeof collageEditorPreferences)["use"]>

export const CollageEditorPreferencesContext = createContext<CollageEditorPreferencesPair>([
  defaultPreferences,
  () => undefined,
])

export function CollageEditorPreferencesContextProvider({ id, children }: { id: string, children: any }) {
  const pair = collageEditorPreferences.use(id)
  return <CollageEditorPreferencesContext.Provider value={pair}>
    {children}
  </CollageEditorPreferencesContext.Provider>
}
