import { keycode } from "api/controls"
import { constrain } from "api/math"
import { Collage } from "engine/file/collage"
import { type Immutable } from "engine/utils/immutable"
import { debug } from "engine/utils/logger"
import { useRef, useState } from "preact/hooks"
import MenuBar from "../common/menu-bar"
import PropertiesPane from "../common/properties"
import { ServerLiaison } from "../common/server-liaison"
import { collageTraceOptions } from "../common/trace-options"
import { useOnSave } from "../common/user-inputs"
import { DoSave } from "../editor"
import { exportYaml } from "../editor-functions"
import { updateImmutableObject } from "../utils/immutable-helper"
import { ImmutableSetter, makeStyleString } from "../utils/preact-help"
import Resizer from "../utils/resizer"
import { useKeyListener } from "../utils/use-key-listener"
import { makeSharedStuff } from "./collage-editor-shared"
import CollageLayout from "./collage-layout"
import { collageEditorPreferences } from "./collage-preferences"
import CollageShowcase from "./collage-showcase"
import MontageEditor from "./montage-editor"
import { getObjectProperties } from "./properties-stuffs"
import InfoPaneFrame from "../common/info-pane"

type CollageEditorProps = {
  readonly id: string
  readonly collage: Immutable<Collage>
  readonly doSave: DoSave
  readonly server: ServerLiaison
  readonly style: string
  readonly setCollage: ImmutableSetter<Collage | null>
}

export default function CollageEditor(props: CollageEditorProps) {
  const {
    id,
    collage,
    doSave,
    server,
    style,
    setCollage,
  } = props
  const [collageEditorPrefs, setCollageEditorPrefs] = collageEditorPreferences.use(id)

  const $el = useRef<null | HTMLDivElement>(null)
  const $graphicalEditorsContainer = useRef<null | HTMLDivElement>(null)
  const $showcaseContainer = useRef<HTMLDivElement>(document.createElement("div"))

  const [expandTraceOptions, setExpandTraceOptions] = useState(false)

  const sharedStuff = makeSharedStuff({
    collage: collage,
    setCollageNull: setCollage,
    server: server,
  })

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

  const onDelete = () => {
  if (sharedStuff.propertiesPath === null || sharedStuff.propertiesPath.length === 0) {
      return
    }
    const propertiesStuff = getObjectProperties(collage, sharedStuff.setCollage, sharedStuff.propertiesPath, () => sharedStuff.setPropertiesPath(null))
    if (!propertiesStuff.allowDelete) {
      return
    }
    updateImmutableObject(sharedStuff.setCollage, propertiesStuff.pathToDeleteThing ?? sharedStuff.propertiesPath, undefined)
    sharedStuff.setPropertiesPath(null)
  }

  useOnSave(() => {
    doSave(exportYaml(collage), { nonInteractive: true })
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
        debug("export of collage JSON:")
        debug(collage)
        break
      case keycode.DEL:
        onDelete()
        break;
    }
  })

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
    "overflow": "hidden",
    "display": "flex",
    "flex-direction": "column",
  }) + style}>
    <MenuBar
      editSettings={() => sharedStuff.setPropertiesPath([])}
      openFileSave={() => doSave(exportYaml(collage), { filter: /\.clg\.yml$/ })}
    ></MenuBar>
    <InfoPaneFrame>
      <div style={makeStyleString({
        "flex": "1",
        "overflow": "hidden",
        "display": "flex",
        "flex-direction": "row",
      })}>
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
      </div>
    </InfoPaneFrame>
  </div>
}
