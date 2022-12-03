import { Immutable } from "engine/utils/immutable"
import { useEffect, useRef, useState } from "preact/hooks"
import { exportLevel } from "../editor-functions"
import { FileLevel } from "../file-types"
import { ImmutableSetter, onlyLeft } from "../preact-help"
import PropertiesPane from "../properties"
import { GlobalEditorShared } from "../shared-types"
import { EditorLevel, useEditorLevel } from "./extended-level-format"
import { useSharedStuff } from "./level-editor-shared"
import LevelEditorTools from "./level-editor-tools"
import LevelGraphicalEditor from "./level-graphical-editor"
import LevelTree from "./level-tree"
import { getObjectProperties } from "./properties-stuffs"

type LevelEditorProps = {
  editorGlobalStuff: GlobalEditorShared
  level: Immutable<FileLevel>
  setLevel: ImmutableSetter<FileLevel | null>
  style: string
}

// export function useStatefulLevelEditor(props: LevelEditorProps) {
//   const [levelEditor] = useState(() => LevelEditor(props))
//   return levelEditor
// }

export default function LevelEditor(props: LevelEditorProps) {
  const {
    editorGlobalStuff,
    level: fileLevel,
    setLevel: setFileLevel,
  } = props

  const [editorLevel, setEditorLevel] = useEditorLevel(fileLevel, setFileLevel)

  const sharedStuff = useSharedStuff({
    globalStuff: editorGlobalStuff,
    level: editorLevel,
  })

  const $el = useRef<HTMLDivElement>(null)
  const $leftMenu = useRef<HTMLDivElement>(null)
  const $graphicalEditorContainer = useRef<HTMLDivElement>(null)
  const $rightMenu = useRef<HTMLDivElement>(null)
  const editorWidth = $el.current === null ? 0 : $el.current.clientWidth
  const editorHeight = $el.current === null ? 0 : $el.current.clientHeight

  useEffect(() => {
    editorGlobalStuff.setOnSettings(() => {
      sharedStuff.setPropertiesPanel(editorLevel)
    })
  }, [])

  const MIN_MENU_WIDTH = 32
  function trackLeftMenuResize(): void {
    sharedStuff.follow({
      shift: (dx, dy) => {
        if (!$leftMenu.current) {
          return
        }
        // const width = $leftMenu.current.clientWidth
        const width = +$leftMenu.current.style.width.replace(/[^0-9-]/g, "")
        const newWidth = Math.max(width + dx, MIN_MENU_WIDTH)
        $leftMenu.current.style.width = newWidth + "px"
      }
    })
  }

  function trackRightMenuResize(): void {
    sharedStuff.follow({
      shift: (dx, dy) => {
        if (!$rightMenu.current) {
          return
        }
        // const width = $rightMenu.current.clientWidth
        const width = +$rightMenu.current.style.width.replace(/[^0-9-]/g, "")
        const newWidth = Math.max(width - dx, MIN_MENU_WIDTH)
        $rightMenu.current.style.width = newWidth + "px"
      }
    })
  }

  return <div ref={$el} className="level-editor" style={`display: flex; flex-flow: column; ${props.style}`}>
    <div className="content" style="flex-grow: 1; overflow: hidden; display: flex;">
      <div ref={$leftMenu} class="menu" style="flex-shrink: 0; width: 128px;">
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
      <div ref={$rightMenu} className="menu" style="flex-shrink: 0; width: 128px; position: relative;">
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