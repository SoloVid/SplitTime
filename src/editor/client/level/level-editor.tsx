import { keycode } from "api/controls"
import { Immutable } from "engine/utils/immutable"
import { debug } from "engine/utils/logger"
import { useContext, useEffect, useMemo, useRef, useState } from "preact/hooks"
import { exportYaml } from "../editor-functions"
import { FileLevel } from "../file-types"
import InfoPaneFrame from "../info-pane"
import MenuBar from "../menu-bar"
import { ImmutableSetter } from "../preact-help"
import { GlobalEditorPreferencesContext } from "../preferences/global-preferences"
import { convertZoomToScale } from "../preferences/scale"
import PropertiesPane from "../properties"
import { GlobalEditorShared } from "../shared-types"
import { updateImmutableObject } from "../utils/immutable-helper"
import Resizer from "../utils/resizer"
import { useKeyListener } from "../utils/use-key-listener"
import { CollageManagerContextProvider } from "./collage-manager"
import { EditorLevel, ObjectMetadataMap } from "./extended-level-format"
import LevelEditorTools from "./level-editor-tools"
import LevelGraphicalEditor from "./level-graphical-editor"
import { LevelEditorPreferencesContext, LevelEditorPreferencesContextProvider } from "./level-preferences"
import LevelTree from "./level-tree"
import { newLevel } from "./new-level"
import { PropertiesContextProvider } from "./properties-context"
import { getObjectProperties } from "./properties-stuffs"
import { useOnSave } from "../user-inputs"
import { DoSave } from "../editor"

type LevelEditorProps = {
  id: string
  editorGlobalStuff: GlobalEditorShared
  doSave: DoSave
  level: Immutable<FileLevel>
  setLevel: ImmutableSetter<FileLevel | null>
  style: string
}

export default function LevelEditor(props: LevelEditorProps) {
  return <LevelEditorPreferencesContextProvider
    id={props.id}
  >
    <LevelEditorInner
      id={props.id}
      editorGlobalStuff={props.editorGlobalStuff}
      doSave={props.doSave}
      level={props.level}
      setLevel={props.setLevel}
      style={props.style}
    />
  </LevelEditorPreferencesContextProvider>
}

export function LevelEditorInner(props: LevelEditorProps) {
  const {
    id,
    editorGlobalStuff,
    doSave,
    level: fileLevel,
    setLevel: setFileLevel,
  } = props

  const [globalEditorPrefs] = useContext(GlobalEditorPreferencesContext)
  const [levelEditorPrefs, setLevelEditorPrefs] = useContext(LevelEditorPreferencesContext)

  const [level, setLevelInner] = useState<EditorLevel>(fileLevel ?? newLevel)
  const setLevel: ImmutableSetter<EditorLevel> = useMemo(() => (transform) => {
    setLevelInner((before) => {
      const after = transform(before)
      setFileLevel(() => after)
      return after
    })
  }, [setFileLevel, setLevelInner])

  const [objectMetadataMap, setObjectMetadataMap] = useState<ObjectMetadataMap>({})

  const $el = useRef<HTMLDivElement>(null)
  const $leftMenu = useRef<HTMLDivElement>(null)
  const $graphicalEditorContainer = useRef<HTMLDivElement>(null)
  const $rightMenu = useRef<HTMLDivElement>(null)

  const scale = convertZoomToScale(globalEditorPrefs.zoom)

  useEffect(() => {
    if (!$graphicalEditorContainer.current) {
      return
    }
    const el = $graphicalEditorContainer.current
    const listener = (e: Event) => {
      setLevelEditorPrefs((before) => ({...before, scroll: {x: el.scrollLeft, y: el.scrollTop}}))
    }
    el.addEventListener("scroll", listener)
    return () => el.removeEventListener("scroll", listener)
  })
  useEffect(() => {
    if ($graphicalEditorContainer.current) {
      $graphicalEditorContainer.current.scrollLeft = levelEditorPrefs.scroll.x
      $graphicalEditorContainer.current.scrollTop = levelEditorPrefs.scroll.y
    }
  }, [$graphicalEditorContainer.current])

  const onDelete = () => {
    if (levelEditorPrefs.propertiesPanel === null || levelEditorPrefs.propertiesPanel === "level") {
      return
    }
    const propertiesStuff = getObjectProperties(level, setLevel, levelEditorPrefs.propertiesPanel, () => setLevelEditorPrefs((before) => ({...before, propertiesPanel: null})))
    if (!propertiesStuff.allowDelete) {
      return
    }
    if (propertiesStuff.pathToDeleteThing) {
      updateImmutableObject(setLevel, propertiesStuff.pathToDeleteThing, undefined)
    }
    setLevelEditorPrefs((before) => ({...before, propertiesPanel: null}))
  }

  useOnSave(() => {
    doSave(exportYaml(level), { nonInteractive: true })
  })

  useKeyListener("keyup", (event) => {
    // TODO: resolve types
    const element = event.target as any
    switch (element.tagName.toLowerCase()) {
      case "input":
      case "textarea":
        return
    }

    switch(event.which) {
      case keycode.ESC:
        debug("export of level JSON:")
        debug(level)
        break
      case keycode.DEL:
        onDelete()
        break;
    }
  })

  const MIN_MENU_WIDTH = 32
  function onLeftMenuResize({ dx }: { dx: number }): void {
    setLevelEditorPrefs((before) => ({
      ...before,
      leftMenuWidth: Math.max(before.leftMenuWidth + dx, MIN_MENU_WIDTH)
    }))
  }

  function onRightMenuResize({ dx }: { dx: number }): void {
    setLevelEditorPrefs((before) => ({
      ...before,
      rightMenuWidth: Math.max(before.rightMenuWidth - dx, MIN_MENU_WIDTH)
    }))
  }

  return <>
    <div ref={$el} className="level-editor" style={`display: flex; flex-flow: column; ${props.style}`}>
      <MenuBar
        editSettings={() => setLevelEditorPrefs((before) => ({...before, propertiesPanel: "level"}))}
        openFileSave={() => doSave(exportYaml(level), { filter: /\.lvl\.yml$/ })}
      ></MenuBar>
      <InfoPaneFrame>
        <CollageManagerContextProvider server={editorGlobalStuff.server}>
          <div className="content" style="flex-grow: 1; overflow: hidden; display: flex;">
            <div ref={$leftMenu} class="menu" style={`flex-shrink: 0; width: ${levelEditorPrefs.leftMenuWidth}px;`}>
              <LevelEditorTools
                level={level}
                scale={scale}
                server={editorGlobalStuff.server}
              />
              <hr/>
              {!!levelEditorPrefs.propertiesPanel && <PropertiesPane
                spec={getObjectProperties(level, setLevel, levelEditorPrefs.propertiesPanel, () => setLevelEditorPrefs((before) => ({...before, propertiesPanel: null})))}
              />}
            </div>
            <Resizer
              resizeType="vertical"
              onResize={onLeftMenuResize}
            ></Resizer>

            <div className="graphical-editor-container" ref={$graphicalEditorContainer} style="flex-grow: 1; overflow: auto;">
              <LevelGraphicalEditor
                globalStuff={editorGlobalStuff}
                level={level}
                setLevel={setLevel}
                objectMetadataMap={objectMetadataMap}
                setObjectMetadataMap={setObjectMetadataMap}
                scale={scale}
              />
            </div>

            <Resizer
              resizeType="vertical"
              onResize={onRightMenuResize}
            ></Resizer>
            <div ref={$rightMenu} className="menu" style={`flex-shrink: 0; width: ${levelEditorPrefs.rightMenuWidth}px; position: relative;`}>
              <LevelTree
                level={level}
                setLevel={setLevel}
                setObjectMetadataMap={setObjectMetadataMap}
              />
            </div>
          </div>
        </CollageManagerContextProvider>
      </InfoPaneFrame>
    </div>
  </>
}