import { Immutable } from "engine/utils/immutable"
import { int } from "globals"
import { useEffect, useState } from "preact/hooks"
import { Mode } from "./level/shared-types"
import { ImmutableSetter } from "./preact-help"

const defaultGlobalId = "DEFAULT"

function makePreferences<T extends object>(prefix: string, defaultPreferences: Immutable<T>) {
  function getSpecificPreferences(id: string): Partial<T> {
    const prefString = localStorage.getItem(prefix + id) ?? ""
    try {
      return JSON.parse(prefString) as Partial<T>
    } catch (e) {
      return {}
    }
  }

  function getPreferences(id: string | null): Immutable<T> {
    const globalPrefs = getSpecificPreferences(defaultGlobalId)
    const localPrefs = id === null ? {} : getSpecificPreferences(id)
    return {
      ...defaultPreferences,
      ...globalPrefs,
      ...localPrefs,
    }
  }

  function setPreferences(id: string | null, preferences: Immutable<T>): void {
    const prefString = JSON.stringify(preferences)
    localStorage.setItem(prefix + defaultGlobalId, prefString)
    if (id !== null) {
      localStorage.setItem(prefix + id, prefString)
    }
  }

  function usePreferences(id: string | null): [Immutable<T>, ImmutableSetter<T>] {
    const [prefsInMemory, setPrefsInMemory] = useState(() => getPreferences(id))
    const [storedId, setStoredId] = useState(id)
    useEffect(() => {
      if (id !== storedId) {
        setPrefsInMemory(getPreferences(id))
        setStoredId(id)
      }
    }, [id, storedId])
    const setPrefs: ImmutableSetter<T> = (transform) => {
      setPrefsInMemory((before) => {
        const after = transform(before)
        setPreferences(id, after)
        return after
      })
    }
    return [prefsInMemory, setPrefs]
  }

  return {
    use: usePreferences
  }
}

export const globalEditorPreferences = makePreferences<{
  readonly gridEnabled: boolean
  readonly gridCell: { readonly x: int, readonly y: int }
  readonly zoom: number
}>("editor-prefs:", {
  gridEnabled: false,
  gridCell: {
    x: 32,
    y: 32,
  },
  zoom: 100,
})

export const collageEditorPreferences = makePreferences<{
  readonly leftMenuWidth: number
  readonly middlePercent: number
  readonly topPercent: number
}>("editor-prefs:collage:", {
  leftMenuWidth: 128,
  middlePercent: 70,
  topPercent: 70,
})

export const levelEditorPreferences = makePreferences<{
  readonly leftMenuWidth: number
  readonly rightMenuWidth: number
  readonly mode: Mode
  readonly collageSelected: string | null
  readonly montageSelected: string | null
  readonly montageDirectionSelected: string | null
  readonly scroll: { x: number, y: number }
  readonly activeGroup: string | null
  readonly collapsedGroups: readonly string[]
  readonly hidden: {
    readonly traces: readonly number[]
    readonly props: readonly number[]
    readonly positions: readonly number[]
  }
}>("editor-prefs:level:", {
  leftMenuWidth: 128,
  rightMenuWidth: 128,
  mode: "trace",
  collageSelected: null,
  montageSelected: null,
  montageDirectionSelected: null,
  scroll: { x: 0, y: 0 },
  activeGroup: null,
  collapsedGroups: [],
  hidden: {
    traces: [],
    props: [],
    positions: [],
  },
})

export type LevelEditorPreferences = ReturnType<(typeof levelEditorPreferences)["use"]>[0]
