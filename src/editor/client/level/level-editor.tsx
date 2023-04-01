import { Immutable } from "engine/utils/immutable"
import { useEffect, useRef } from "preact/hooks"
import { FileLevel } from "../file-types"
import { ImmutableSetter, onlyLeft } from "../preact-help"
import { levelEditorPreferences } from "../preferences"
import PropertiesPane from "../properties"
import { GlobalEditorShared } from "../shared-types"
import { updateImmutableObject } from "../utils/immutable-helper"
import { useEditorLevel } from "./extended-level-format"
import { useSharedStuff } from "./level-editor-shared"
import LevelEditorTools from "./level-editor-tools"
import LevelGraphicalEditor from "./level-graphical-editor"
import LevelTree from "./level-tree"
import { getObjectProperties } from "./properties-stuffs"
import { useSetIntervalWhenActive } from "../utils/use-set-interval-when-active"

type LevelEditorProps = {
  id: string
  editorGlobalStuff: GlobalEditorShared
  level: Immutable<FileLevel>
  setLevel: ImmutableSetter<FileLevel | null>
  style: string
}

export default function LevelEditor(props: LevelEditorProps) {
  const {
    id,
    editorGlobalStuff,
    level: fileLevel,
    setLevel: setFileLevel,
  } = props

  const [levelEditorPrefs, setLevelEditorPrefs] = levelEditorPreferences.use(id)

  const [editorLevel, setEditorLevel] = useEditorLevel(fileLevel, setFileLevel, levelEditorPrefs)

  const sharedStuff = useSharedStuff({
    globalStuff: editorGlobalStuff,
    level: editorLevel,
    id: id,
  })

  const $el = useRef<HTMLDivElement>(null)
  const $leftMenu = useRef<HTMLDivElement>(null)
  const $graphicalEditorContainer = useRef<HTMLDivElement>(null)
  const $rightMenu = useRef<HTMLDivElement>(null)

  useEffect(() => {
    editorGlobalStuff.setOnSettings(() => {
      sharedStuff.setPropertiesPanel(editorLevel)
    })
  }, [])

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

  function hiddenIndexes(list: readonly { metadata: { displayed: boolean }}[]) {
    return list.map((e, i) => [e, i] as const).filter(([e, i]) => !e.metadata.displayed).map(([e, i]) => i)
  }
  useSetIntervalWhenActive(() => {
    const collapsedGroups = editorLevel.groups.filter(g => g.metadata.collapsed).map(g => g.obj.id)
    const hidden = {
      traces: hiddenIndexes(editorLevel.traces),
      props: hiddenIndexes(editorLevel.props),
      positions: hiddenIndexes(editorLevel.positions),
    }
    if (JSON.stringify(collapsedGroups) !== JSON.stringify(levelEditorPrefs.collapsedGroups) || JSON.stringify(hidden) !== JSON.stringify(levelEditorPrefs.hidden)) {
      setLevelEditorPrefs((before) => ({...before, collapsedGroups, hidden}))
    }
  }, 100, [editorLevel])

  useEffect(() => {
    editorGlobalStuff.setOnDelete(() => {
      if (sharedStuff.propertiesPath === null || sharedStuff.propertiesPath.length === 0) {
        return
      }
      const propertiesStuff = getObjectProperties(editorLevel, setEditorLevel, sharedStuff.propertiesPath, () => sharedStuff.setPropertiesPanel(null))
      if (!propertiesStuff.allowDelete) {
        return
      }
      updateImmutableObject(setEditorLevel, propertiesStuff.pathToDeleteThing ?? sharedStuff.propertiesPath, undefined)
      sharedStuff.setPropertiesPanel(null)
    })
  }, [sharedStuff.propertiesPath])

  const MIN_MENU_WIDTH = 32
  function trackLeftMenuResize(): void {
    sharedStuff.follow({
      shift: (dx, dy) => {
        if (!$leftMenu.current) {
          return
        }
        setLevelEditorPrefs((before) => ({
          ...before,
          leftMenuWidth: Math.max(before.leftMenuWidth + dx, MIN_MENU_WIDTH)
        }))
      }
    })
  }

  function trackRightMenuResize(): void {
    sharedStuff.follow({
      shift: (dx, dy) => {
        if (!$rightMenu.current) {
          return
        }
        setLevelEditorPrefs((before) => ({
          ...before,
          rightMenuWidth: Math.max(before.rightMenuWidth - dx, MIN_MENU_WIDTH)
        }))
      }
    })
  }

  return <div ref={$el} className="level-editor" style={`display: flex; flex-flow: column; ${props.style}`}>
    <div className="content" style="flex-grow: 1; overflow: hidden; display: flex;">
      <div ref={$leftMenu} class="menu" style={`flex-shrink: 0; width: ${levelEditorPrefs.leftMenuWidth}px;`}>
        <LevelEditorTools
          editorGlobalStuff={editorGlobalStuff}
          levelEditorShared={sharedStuff}
        />
        <hr/>
        {!!sharedStuff.propertiesPath && <PropertiesPane
          editorGlobalStuff={editorGlobalStuff}
          spec={getObjectProperties(editorLevel, setEditorLevel, sharedStuff.propertiesPath, () => sharedStuff.setPropertiesPanel(null))}
        />}
      </div>
      <div
        className="vertical-resize-bar"
        onMouseDown={onlyLeft(trackLeftMenuResize, true)}
        style="flex-shrink: 0; right: 0;"
      ></div>

      <div className="graphical-editor-container" ref={$graphicalEditorContainer} style="flex-grow: 1; overflow: auto;">
        <LevelGraphicalEditor
          levelEditorShared={sharedStuff}
        />
      </div>

      <div
        className="vertical-resize-bar"
        onMouseDown={onlyLeft(trackRightMenuResize, true)}
        style="flex-shrink: 0; left: 0;"
      ></div>
      <div ref={$rightMenu} className="menu" style={`flex-shrink: 0; width: ${levelEditorPrefs.rightMenuWidth}px; position: relative;`}>
        <LevelTree
        levelEditorShared={sharedStuff}
        />
      </div>
    </div>

    <div id="info-pane" style="padding: 2px;">
      {Object.entries(sharedStuff.info).map(([name, value]) => (
        <span key={name} className="info-key-value">
          {name}: {value}
        </span>
      ))}
    </div>
  </div>
}