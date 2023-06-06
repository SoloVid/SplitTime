import { createContext } from "preact"
import { makePreferences } from "./preferences"
import { int } from "globals"

export type GlobalEditorPreferences = {
  readonly gridEnabled: boolean
  readonly gridCell: { readonly x: int, readonly y: int }
  readonly zoom: number
}

const defaultPreferences: GlobalEditorPreferences = {
  gridEnabled: false,
  gridCell: {
    x: 32,
    y: 32,
  },
  zoom: 100,
}

export const globalEditorPreferences = makePreferences<GlobalEditorPreferences>("editor-prefs:", defaultPreferences)

export type GlobalEditorPreferencesPair = ReturnType<(typeof globalEditorPreferences)["use"]>

export const GlobalEditorPreferencesContext = createContext<GlobalEditorPreferencesPair>([
  defaultPreferences,
  () => undefined,
])

export function GlobalEditorPreferencesContextProvider({ id, children }: { id: string, children: any }) {
  const pair = globalEditorPreferences.use(id)
  return <GlobalEditorPreferencesContext.Provider value={pair}>
    {children}
  </GlobalEditorPreferencesContext.Provider>
}
