import { keycode } from "api/controls"
import { constrain } from "api/math"
import { Collage } from "engine/file/collage"
import { type Immutable } from "engine/utils/immutable"
import { debug } from "engine/utils/logger"
import { useContext, useMemo, useRef, useState } from "preact/hooks"
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
import { makeSharedStuff, useCollageEditorControls } from "./collage-editor-shared"
import CollageLayout from "./collage-layout"
import { CollageEditorPreferencesContext, CollageEditorPreferencesContextProvider, collageEditorPreferences } from "./collage-preferences"
import CollageShowcase from "./collage-showcase"
import MontageEditor from "./montage-editor"
import { getObjectProperties } from "./properties-stuffs"
import InfoPaneFrame from "../common/info-pane"
import { convertZoomToScale } from "../preferences/scale"
import { GlobalEditorPreferencesContext } from "../preferences/global-preferences"
import { makeCollageFromFile } from "engine/graphics/collage"

type CollageEditorProps = {
  readonly id: string
  readonly collage: Immutable<Collage>
  readonly doSave: DoSave
  readonly server: ServerLiaison
  readonly style: string
  readonly setCollage: ImmutableSetter<Collage>
}

export default function CollageEditor(props: CollageEditorProps) {
  return <CollageEditorPreferencesContextProvider
    id={props.id}
  >
    <CollageEditorInner
      id={props.id}
      collage={props.collage}
      server={props.server}
      doSave={props.doSave}
      setCollage={props.setCollage}
      style={props.style}
    />
  </CollageEditorPreferencesContextProvider>
}

function CollageEditorInner(props: CollageEditorProps) {
  const {
    id,
    collage,
    doSave,
    server,
    style,
    setCollage,
  } = props
  const [globalPrefs] = useContext(GlobalEditorPreferencesContext)
  const [collageEditorPrefs, setCollageEditorPrefs] = useContext(CollageEditorPreferencesContext)

  const $el = useRef<null | HTMLDivElement>(null)
  const $graphicalEditorsContainer = useRef<null | HTMLDivElement>(null)
  const $showcaseContainer = useRef<HTMLDivElement>(document.createElement("div"))

  const scale = convertZoomToScale(globalPrefs.zoom)

  const [expandTraceOptions, setExpandTraceOptions] = useState(false)
  const [traceIdInProgress, setTraceIdInProgress] = useState<string | null>(null)

  const collageEditorControls = useCollageEditorControls({
    globalPrefs,
    setCollage,
    setCollagePrefs: setCollageEditorPrefs,
    setTraceIdInProgress: setTraceIdInProgress,
  })

  const realCollage = useMemo(() => makeCollageFromFile(collage, true), [collage])
  const editingMontage = collage.montages.find(m => m.id === collageEditorPrefs.montageSelected) ?? null

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
    if (collageEditorPrefs.propertiesPanel === null || collageEditorPrefs.propertiesPanel === "collage") {
      return
    }
    const propertiesStuff = getObjectProperties(collage, setCollage, collageEditorPrefs.propertiesPanel, () => undefined)
    if (propertiesStuff === null) {
      return
    }
    if (!propertiesStuff.allowDelete) {
      return
    }
    if (propertiesStuff.pathToDeleteThing) {
      updateImmutableObject(setCollage, propertiesStuff.pathToDeleteThing, undefined)
    }
    setCollageEditorPrefs((before) => ({
      ...before,
      propertiesPanel: null,
    }))
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

  const objectPropertiesSpec = !!collageEditorPrefs.propertiesPanel ? getObjectProperties(collage, setCollage, collageEditorPrefs.propertiesPanel, () => setCollageEditorPrefs((before) => ({...before, propertiesPanel: null}))) : null

  return <div ref={$el} className="collage-editor" style={makeStyleString({
    "overflow": "hidden",
    "display": "flex",
    "flex-direction": "column",
  }) + style}>
    <MenuBar
      editSettings={() => setCollageEditorPrefs((before) => ({...before, propertiesPanel: "collage",}))}
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
              (expandTraceOptions || collageEditorPrefs.traceType === traceOption.type) && <div
                key={traceOption.type}
                className="option"
                style={`color: white; background-color: ${traceOption.color};`}
                onClick={() => {
                  setExpandTraceOptions(false)
                  setCollageEditorPrefs((before) => ({
                    ...before,
                    traceType: traceOption.type,
                  }))
                }}
                title={traceOption.help}
              >
                {collageEditorPrefs.traceType === traceOption.type && ">> "}
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
          {!!objectPropertiesSpec && <PropertiesPane
            spec={objectPropertiesSpec}
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
                collage={collage}
                controls={collageEditorControls}
                scale={scale}
                setCollage={setCollage}
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
                $container={$showcaseContainer.current}
                collage={collage}
                controls={collageEditorControls}
                realCollage={realCollage}
                scale={scale}
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
            {!!editingMontage && <MontageEditor
              collage={collage}
              controls={collageEditorControls}
              montage={editingMontage}
              realCollage={realCollage}
              scale={scale}
              traceIdInProgress={traceIdInProgress}
            />}
          </div>
        </div>
      </div>
    </InfoPaneFrame>
  </div>
}
