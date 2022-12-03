import { Collage } from "engine/file/collage"
import { type Immutable } from "engine/utils/immutable"
import { Coordinates2D } from "engine/world/level/level-location"
import { useEffect, useRef } from "preact/hooks"
import { ImmutableSetter } from "../preact-help"
import PropertiesPane from "../properties"
import { GlobalEditorShared, UserInputs } from "../shared-types"
import { traceOptions } from "../trace-options"
import { makeSharedStuff } from "./collage-editor-shared"
import CollageLayout from "./collage-layout"
import CollageShowcase from "./collage-showcase"
import MontageEditor from "./montage-editor"
import { getObjectProperties } from "./properties-stuffs"
import { EDITOR_PADDING } from "./shared-types"

type CollageEditorProps = {
  readonly editorGlobalStuff: GlobalEditorShared
  readonly collage: Immutable<Collage>
  readonly style: string
  readonly setCollage: ImmutableSetter<Collage | null>
}

export default function CollageEditor(props: CollageEditorProps) {
  const {
    collage,
    editorGlobalStuff,
    style,
    setCollage,
  } = props
  const editorInputs = editorGlobalStuff.userInputs

  const $el = useRef<null | HTMLDivElement>(null)

  // const [sharedStuff, setSharedStuff] = useState(makeSharedStuff({
  //   collage: collage,
  //   globalStuff: editorGlobalStuff,
  // }))
  const sharedStuff = makeSharedStuff({
    collage: collage,
    setCollageNull: setCollage,
    globalStuff: editorGlobalStuff,
  })

  function inputs(): UserInputs {
    const mouse = {
      x: editorInputs.mouse.x - position().x - EDITOR_PADDING,
      y: editorInputs.mouse.y - position().y - EDITOR_PADDING,
      // FTODO: only is down when inside level editor
      isDown: editorInputs.mouse.isDown
    }
    return {
      mouse,
      ctrlDown: editorInputs.ctrlDown
    }
  }

  function position(): Coordinates2D {
    if (!$el.current) {
      return {
        x: 0,
        y: 0
      }
    }
    return {
      x: $el.current.offsetLeft,
      y: $el.current.offsetTop
    }
  }

  function editorWidth(): number {
    if (!$el.current) {
      return 0
    }
    return $el.current.clientWidth
  }
  function editorHeight(): number {
    if (!$el.current) {
      return 0
    }
    return $el.current.clientHeight
  }

  // useEffect(() => {
  //   sharedStuff.setSelectedFrame(null)
  //   sharedStuff.setSelectedMontage(null)
  // }, [collage])

  useEffect(() => {
    editorGlobalStuff.setOnSettings(() => {
      sharedStuff.setPropertiesPath([])
    })
  }, [])

  // I'm not sure there's a scenario this makes sense, but it was in the Vue implementation.
  // useEffect(() => {
  //   editorGlobalStuff.setOnSettings(() => {
  //     sharedStuff.editProperties(getCollagePropertiesStuff(collage))
  //   })
  // }, [supervisorControl])

  return <div ref={$el} className="collage-editor" style={`overflow-y: auto;${style}`}>
    <div class="top-row" style="display: flex; flex-flow: row; height: 50%;">
      <div class="menu">
        <div class="trace-type-options">
          {traceOptions.map((traceOption) => (
          <div
            key={traceOption.type}
            className="option"
            style={`color: white; background-color: ${traceOption.color};`}
            onClick={() => sharedStuff.setTraceTypeSelected(traceOption.type)}
            title={traceOption.help}
          >
            { traceOption.type }
          </div>
          ))}
        </div>
        <hr/>
        {!!sharedStuff.propertiesPath && <PropertiesPane
          editorGlobalStuff={editorGlobalStuff}
          spec={getObjectProperties(collage, sharedStuff.setCollage, sharedStuff.propertiesPath, () => sharedStuff.setPropertiesPath(null))}
        />}
      </div>
      <div class="collage-layout-container" style="flex-grow: 1; height: 100%; overflow: auto">
        <CollageLayout
          collageEditorShared={sharedStuff}
        />
      </div>
      <div class="collage-showcase-container" style="flex-grow: 1; overflow: auto;">
        <CollageShowcase
          style="flex-grow: 1;"
          collageEditHelper={sharedStuff}
          collageViewHelper={sharedStuff}
        />
      </div>
    </div>
    <div style="overflow: auto; height: 50%;">
      {!!sharedStuff.selectedMontage && !!sharedStuff.selectedMontageIndex && <MontageEditor
        collageEditorShared={sharedStuff}
        montageIndex={sharedStuff.selectedMontageIndex}
        montage={sharedStuff.selectedMontage}
      />}
    </div>
  </div>
}
