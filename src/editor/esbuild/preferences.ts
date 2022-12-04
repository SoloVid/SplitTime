import { Immutable } from "engine/utils/immutable"
import { int } from "globals"
import { useEffect, useState } from "preact/hooks"
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
    const [prefsInMemory, setPrefsInMemory] = useState(() => defaultPreferences)
    useEffect(() => {
      setPrefsInMemory(getPreferences(id))
    }, [id])
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

export const levelEditorPreferences = makePreferences<{
  readonly leftMenuWidth: number
  readonly rightMenuWidth: number
}>("editor-prefs:level:", {
  leftMenuWidth: 128,
  rightMenuWidth: 128,
})
