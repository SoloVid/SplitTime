import { Collage } from "engine/graphics/collage"
import { Immutable } from "engine/utils/immutable"
import { TraceTypeType } from "engine/world/level/trace/trace-type"
import { useContext, useEffect, useMemo, useRef, useState } from "preact/hooks"
import { SharedStuffViewOnly as CollageSharedStuff } from "../collage/collage-editor-shared"
import CollageShowcase from "../collage/collage-showcase"
import { ServerLiaison } from "../common/server-liaison"
import { traceOptions } from "../common/trace-options"
import { UserInputsContext } from "../common/user-inputs"
import { FilePopupContext } from "../file-browser/file-popup"
import { makeClassNames, makeStyleString, onlyLeft } from "../utils/preact-help"
import { CollageManagerContext } from "./collage-manager"
import { EditorLevel } from "./extended-level-format"
import { LevelEditorPreferencesContext } from "./level-preferences"
import { Mode, POSITION_ICON, PROP_ICON, TRACE_ICON } from "./shared-types"

type LevelEditorToolsProps = {
  level: EditorLevel
  scale: number
  server: ServerLiaison
}

function useCollageViewHelper(props: LevelEditorToolsProps): CollageSharedStuff | null {
  const [montageIndex, setMontageIndexInternal] = useState<number | null>(null)

  const [prefs, setPrefs] = useContext(LevelEditorPreferencesContext)
  const collageManager = useContext(CollageManagerContext)
  const userInputs = useContext(UserInputsContext)

  const collageId = prefs.collageSelected
  const collage = !collageId ? null : collageManager.getCollage(collageId)

  const realCollage = useMemo<Immutable<Collage> | null>(() => {
    if (!collageId) {
      return null
    }
    return collageManager.getRealCollage(collageId)
  }, [collageId, collageManager])

  const selectMontage = (montageIndex: number | null) => {
    setMontageIndexInternal(montageIndex)
    if (montageIndex === null || collage === null) {
      setPrefs((before) => ({...before, montageSelected: null, montageDirectionSelected: null}))
      return
    }

    const m = collage.montages[montageIndex]
    setPrefs((before) => ({...before, montageSelected: m.id, montageDirectionSelected: m.direction}))
  }

  useEffect(() => {
    if (collage === null) {
      return
    }
    const index = collage.montages.findIndex(m => m.id === prefs.montageSelected && m.direction === prefs.montageDirectionSelected)
    if (index < 0) {
      selectMontage(null)
    } else {
      setMontageIndexInternal(index)
    }
  }, [collage])

  if (collage === null || realCollage === null) {
    return null
  }

  return {
    collage,
    get selectedMontage() {
      if (montageIndex === null) {
        return null
      }
      return collage.montages[montageIndex]
    },
    realCollage,
    globalStuff: {
      get scale() { return props.scale },
      server: props.server,
      userInputs: userInputs,
    },
    selectMontage,
  }
}

export default function LevelEditorTools(props: LevelEditorToolsProps) {
  const {
    level
  } = props

  const collageViewHelper = useCollageViewHelper(props)
  const [prefs, setPrefs] = useContext(LevelEditorPreferencesContext)
  const filePopupControls = useContext(FilePopupContext)

  const mode = prefs.mode

  const $collageShowcaseContainer = useRef<HTMLDivElement>(document.createElement("div"))

  async function launchCollageFileBrowser(): Promise<void> {
    const suffixRegex = /\.clg\.yml$/
    const filePath = await filePopupControls.showFileSelectPopup({
      filter: suffixRegex,
    })
    const prefixRegex = /^\//
    const collageId = filePath === "" ? null : filePath.replace(prefixRegex, "").replace(suffixRegex, "")
    setPrefs((before) => ({...before, collageSelected: collageId}))
  }
  function selectModeOption(mode: Mode): void {
    setPrefs((before) => ({...before, mode: mode}))
  }
  function selectTraceOption(type: TraceTypeType): void {
    setPrefs((before) => ({...before, mode: "trace", traceType: type}))
  }

  return <div>
    <div style="display: flex; flex-flow: row; justify-content: center;">
      <div className={makeClassNames({ option: true, active: mode === 'trace' })}
        onClick={() => selectModeOption('trace')}
        title="Trace"
      >
        <i className={`fas fa-${TRACE_ICON}`}></i>
      </div>
      <div className={makeClassNames({ option: true, active: mode === 'prop' })}
        onClick={() => selectModeOption('prop')}
        title="Prop"
      >
        <i className={`fas fa-${PROP_ICON}`}></i>
      </div>
      <div className={makeClassNames({ option: true, active: mode === 'position' })}
        onClick={() => selectModeOption('position')}
        title="Position"
      >
        <i className={`fas fa-${POSITION_ICON}`}></i>
      </div>
    </div>
    {mode === "trace" && <div className="trace-type-options">
      {traceOptions.map((traceOption) => (
        <div
          key={traceOption.type}
          className="option"
          style={`color: white; background-color: ${traceOption.color}`}
          onClick={() => selectTraceOption(traceOption.type)}
          title={traceOption.help}
        >
            {prefs.traceType === traceOption.type && ">> "}
          { traceOption.type }
        </div>
      ))}
    </div>}
    {(mode === 'prop' || mode === 'position') && <div className="collage-tool">
      <input
        value={prefs.collageSelected ?? ""}
        onDblClick={onlyLeft(launchCollageFileBrowser)}
        placeholder="Select a collage..."
        readonly={true}
        className="block pointer"
      />
      {collageViewHelper !== null && <div style={makeStyleString({
        "position": "relative",
        "height": `${window.innerHeight / 2}px`,
        "overflow-x": "hidden",
        "overflow-y": "scroll",
      })}><div class="collage-showcase-container"
        ref={$collageShowcaseContainer}
        style={makeStyleString({
          "height": "100%",
        })}
      >
        <CollageShowcase
          collageViewHelper={collageViewHelper}
          scale={props.scale}
          $container={$collageShowcaseContainer.current}
        />
      </div></div>}
    </div>}
  </div>
}