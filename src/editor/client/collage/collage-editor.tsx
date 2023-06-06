import { constrain } from "api/math"
import { Collage } from "engine/file/collage"
import { type Immutable } from "engine/utils/immutable"
import { Coordinates2D } from "engine/world/level/level-location"
import { useEffect, useRef, useState } from "preact/hooks"
import { ImmutableSetter, makeStyleString, onlyLeft } from "../preact-help"
import { collageEditorPreferences } from "../preferences/preferences"
import PropertiesPane from "../properties"
import { GlobalEditorShared, UserInputs } from "../shared-types"
import { collageTraceOptions } from "../trace-options"
import { updateImmutableObject } from "../utils/immutable-helper"
import Resizer from "../utils/resizer"
import { makeSharedStuff } from "./collage-editor-shared"
import CollageLayout from "./collage-layout"
import CollageShowcase from "./collage-showcase"
import MontageEditor from "./montage-editor"
import { getObjectProperties } from "./properties-stuffs"
import { EDITOR_PADDING } from "./shared-types"

type CollageEditorProps = {
  readonly id: string
  readonly editorGlobalStuff: GlobalEditorShared
  readonly collage: Immutable<Collage>
  readonly style: string
  readonly setCollage: ImmutableSetter<Collage | null>
}

export default function CollageEditor(props: CollageEditorProps) {
  const {
    id,
    collage,
    editorGlobalStuff,
    style,
    setCollage,
  } = props
  const editorInputs = editorGlobalStuff.userInputs

  const [collageEditorPrefs, setCollageEditorPrefs] = collageEditorPreferences.use(id)

  const $el = useRef<null | HTMLDivElement>(null)
  const $graphicalEditorsContainer = useRef<null | HTMLDivElement>(null)
  const $showcaseContainer = useRef<HTMLDivElement>(document.createElement("div"))

  const [expandTraceOptions, setExpandTraceOptions] = useState(false)

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
    if (!$graphicalEditorsContainer.current) {
      return 1
    }
    return $graphicalEditorsContainer.current.clientWidth
  }
  function editorHeight(): number {
    if (!$graphicalEditorsContainer.current) {
      return 1
    }
    return $graphicalEditorsContainer.current.clientHeight
  }

  useEffect(() => {
    editorGlobalStuff.setOnSettings(() => {
      sharedStuff.setPropertiesPath([])
    })
  }, [])

  useEffect(() => {
    editorGlobalStuff.setOnDelete(() => {
      if (sharedStuff.propertiesPath === null || sharedStuff.propertiesPath.length === 0) {
        return
      }
      const propertiesStuff = getObjectProperties(collage, sharedStuff.setCollage, sharedStuff.propertiesPath, () => sharedStuff.setPropertiesPath(null))
      if (!propertiesStuff.allowDelete) {
        return
      }
      updateImmutableObject(sharedStuff.setCollage, propertiesStuff.pathToDeleteThing ?? sharedStuff.propertiesPath, undefined)
      sharedStuff.setPropertiesPath(null)
    })
  }, [sharedStuff.propertiesPath])

  const leftMenuWidth = collageEditorPrefs.leftMenuWidth
  function onLeftMenuResize({ dx }: { dx: number }) {
    setCollageEditorPrefs((before) => ({
      ...before,
      leftMenuWidth: before.leftMenuWidth + dx,
    }))
  }

  const middlePercent = collageEditorPrefs.middlePercent
  function onMiddleResize({ dx }: { dx: number }) {
    const dxPercent = 100 * dx / editorWidth()
    setCollageEditorPrefs((before) => ({
      ...before,
      middlePercent: constrain(before.middlePercent + dxPercent, 10, 90),
    }))
  }

  const topPercent = collageEditorPrefs.topPercent
  function onVerticalResize({ dy }: { dy: number }) {
    const dyPercent = 100 * dy / editorHeight()
    setCollageEditorPrefs((before) => ({
      ...before,
      topPercent: constrain(before.topPercent + dyPercent, 10, 90),
    }))
  }

  return <div ref={$el} className="collage-editor" style={makeStyleString({
    "overflow-y": "auto",
    "display": "flex",
    "flex-direction": "row",
  }) + style}>
    <div class="menu" style={makeStyleString({
      "width": `${leftMenuWidth}px`,
      "flex": `0 0 ${leftMenuWidth}px`,
    })}>
      <div class="trace-type-options">
        {collageTraceOptions.map((traceOption) => (
          (expandTraceOptions || sharedStuff.traceTypeSelected === traceOption.type) && <div
            key={traceOption.type}
            className="option"
            style={`color: white; background-color: ${traceOption.color};`}
            onClick={() => {
              setExpandTraceOptions(false)
              sharedStuff.setTraceTypeSelected(traceOption.type)
            }}
            title={traceOption.help}
          >
            {sharedStuff.traceTypeSelected === traceOption.type && ">> "}
            { traceOption.type }
          </div>
        ))}
        {!expandTraceOptions && <div
          className="option"
          style={`color: black; background-color: white;`}
          onClick={() => setExpandTraceOptions(true)}
        >
          other types
        </div>}
      </div>
      <hr/>
      {!!sharedStuff.propertiesPath && <PropertiesPane
        editorGlobalStuff={editorGlobalStuff}
        spec={getObjectProperties(collage, sharedStuff.setCollage, sharedStuff.propertiesPath, () => sharedStuff.setPropertiesPath(null))}
      />}
    </div>
    <Resizer
      resizeType="vertical"
      onResize={onLeftMenuResize}
    ></Resizer>
    <div class="graphical-editors-container" ref={$graphicalEditorsContainer} style={makeStyleString({
      "flex": "1",
    })}>
      <div class="top-row" style={makeStyleString({
        "display": "flex",
        "flex-direction": "row",
        "height": `${topPercent}%`,
      })}>
        <div class="collage-layout-container" style={makeStyleString({
          "width": `${middlePercent}%`,
          "flex": `${middlePercent}`,
          "height": "100%",
          "overflow": "auto",
          "position": "relative",
        })}>
          <CollageLayout
            collageEditorShared={sharedStuff}
          />
        </div>
        <Resizer
          resizeType="vertical"
          onResize={onMiddleResize}
        ></Resizer>
        <div class="collage-showcase-container" ref={$showcaseContainer} style={makeStyleString({
          "width": `${Math.floor(100 - middlePercent)}%`,
          "flex": `${Math.floor(100 - middlePercent)}`,
          "height": "100%",
          "overflow-x": "hidden",
          "overflow-y": "auto",
          "position": "relative",
        })}>
          <CollageShowcase
            style="flex: 1;"
            collageEditHelper={sharedStuff}
            collageViewHelper={sharedStuff}
            $container={$showcaseContainer.current}
          />
        </div>
      </div>
      <Resizer
        resizeType="horizontal"
        onResize={onVerticalResize}
      ></Resizer>
      <div style={makeStyleString({
        "overflow": "auto",
        "height": `${Math.floor(100 - topPercent)}%`,
        "position": "relative",
      })}>
        {!!sharedStuff.selectedMontage && sharedStuff.selectedMontageIndex !== null && <MontageEditor
          collageEditorShared={sharedStuff}
          montageIndex={sharedStuff.selectedMontageIndex}
          montage={sharedStuff.selectedMontage}
        />}
      </div>
    </div>

    <div id="info-pane" style="padding: 2px;position:fixed;bottom:0;">
      {Object.entries(sharedStuff.info).map(([name, value]) => (
        <span key={name} className="info-key-value">
          {name}: {value}
        </span>
      ))}
    </div>
  </div>
}
