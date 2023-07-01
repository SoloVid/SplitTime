import { createContext } from "preact";
import { ImmutableSetter } from "../preact-help";
import { BasePath } from "../utils/immutable-helper";
import { EditorLevel } from "./extended-level-format";
import { useContext, useMemo, useState } from "preact/hooks";
import { GlobalEditorPreferencesContext } from "../preferences/global-preferences";

type PropertiesContextStuff<T> = {
  setObject: ImmutableSetter<T>
  path: BasePath | null
  setPath: ImmutableSetter<BasePath | null>
}

export const PropertiesContext = createContext<PropertiesContextStuff<EditorLevel>>({
  setObject: () => undefined,
  path: [],
  setPath: () => undefined,
})

type PropertiesPathContextStuff<T> = {
  setPath: ImmutableSetter<BasePath | null>
}

export const PropertiesPathContext = createContext<PropertiesPathContextStuff<EditorLevel>>({
  setPath: () => undefined,
})

type Props = {
  children: any
  setLevel: ImmutableSetter<EditorLevel>
}

export function PropertiesContextProvider({
  children,
  setLevel,
}: Props) {
  const [prefs, setPrefs] = useContext(GlobalEditorPreferencesContext)
  const path = prefs.propertiesPath
  const setPath = useMemo<ImmutableSetter<BasePath | null>>(() => (transform) => {
    setPrefs((prefsBefore) => ({
      ...prefsBefore,
      propertiesPath: transform(prefsBefore.propertiesPath),
    }))
  }, [setPrefs])
  // const [path, setPath] = useState<BasePath>([])

  const fullPropertiesValue = useMemo<PropertiesContextStuff<EditorLevel>>(() => ({
    setObject: setLevel,
    path: path,
    setPath: setPath,
  }), [setLevel, path, setPath])

  const propertiesPathValue = useMemo<PropertiesPathContextStuff<EditorLevel>>(() => ({
    setPath: setPath,
  }), [setPath])

  return <PropertiesContext.Provider value={fullPropertiesValue}>
    <PropertiesPathContext.Provider value={propertiesPathValue}>
      {children}
    </PropertiesPathContext.Provider>
  </PropertiesContext.Provider>
}
