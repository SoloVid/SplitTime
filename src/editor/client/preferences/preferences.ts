import { Immutable } from "engine/utils/immutable"
import { useEffect, useState } from "preact/hooks"
import { ImmutableSetter } from "../utils/preact-help"

const defaultGlobalId = "DEFAULT"

export function makePreferences<T extends object>(prefix: string, defaultPreferences: Immutable<T>) {
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
