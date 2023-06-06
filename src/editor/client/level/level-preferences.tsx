import { createContext } from "preact"
import { Mode } from "../level/shared-types"
import { makePreferences } from "../preferences/preferences"
import { TraceTypeType } from "engine/world/level/trace/trace-type"

export type LevelEditorPreferences = {
  readonly leftMenuWidth: number
  readonly rightMenuWidth: number
  readonly scroll: { x: number, y: number }

  readonly mode: Mode
  readonly traceType: TraceTypeType
  readonly collageSelected: string | null
  readonly montageSelected: string | null
  readonly montageDirectionSelected: string | null

  readonly propertiesPanel: "level" | {
    readonly type: "group" | "prop" | "position" | "trace"
    readonly id: string
  } | null

  readonly activeGroup: string | null
  readonly collapsedGroups: readonly string[]
  readonly hidden: readonly string[]
  // readonly hidden: {
  //   readonly traces: readonly string[]
  //   readonly props: readonly string[]
  //   readonly positions: readonly string[]
  // }
}

const defaultPreferences: LevelEditorPreferences = {
  leftMenuWidth: 128,
  rightMenuWidth: 128,
  scroll: { x: 0, y: 0 },

  mode: "trace",
  traceType: "solid",
  collageSelected: null,
  montageSelected: null,
  montageDirectionSelected: null,

  propertiesPanel: null,

  activeGroup: null,
  collapsedGroups: [],
  hidden: [],
  // hidden: {
  //   traces: [],
  //   props: [],
  //   positions: [],
  // },
}

export const levelEditorPreferences = makePreferences<LevelEditorPreferences>("editor-prefs:level:", defaultPreferences)

export type LevelEditorPreferencesPair = ReturnType<(typeof levelEditorPreferences)["use"]>

export const LevelEditorPreferencesContext = createContext<LevelEditorPreferencesPair>([
  defaultPreferences,
  () => undefined,
])

export function LevelEditorPreferencesContextProvider({ id, children }: { id: string, children: any }) {
  const pair = levelEditorPreferences.use(id)
  return <LevelEditorPreferencesContext.Provider value={pair}>
    {children}
  </LevelEditorPreferencesContext.Provider>
}
