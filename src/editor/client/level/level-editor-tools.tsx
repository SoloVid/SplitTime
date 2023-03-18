import { makeCollageFromFile } from "engine/graphics/collage"
import { TraceTypeType } from "engine/world/level/trace/trace-type"
import { useEffect, useState } from "preact/hooks"
import { SharedStuffViewOnly as CollageSharedStuff } from "../collage/collage-editor-shared"
import CollageShowcase from "../collage/collage-showcase"
import { makeClassNames, onlyLeft } from "../preact-help"
import { GlobalEditorShared } from "../shared-types"
import { traceOptions } from "../trace-options"
import { SharedStuff } from "./level-editor-shared"
import { Mode, POSITION_ICON, PROP_ICON, TRACE_ICON } from "./shared-types"

type LevelEditorToolsProps = {
  editorGlobalStuff: GlobalEditorShared
  levelEditorShared: SharedStuff
}

function useCollageViewHelper(levelEditorShared: SharedStuff): CollageSharedStuff | null {
  const [montageIndex, setMontageIndexInternal] = useState<number | null>(null)

  const collage = levelEditorShared.selectedCollage
  if (collage === null) {
    return null
  }

  const selectMontage = (montageIndex: number | null) => {
    setMontageIndexInternal(montageIndex)
    if (montageIndex === null) {
      levelEditorShared.setSelectedMontage(null)
      levelEditorShared.setSelectedMontageDirection(null)
      return
    }

    const m = collage.montages[montageIndex]
    levelEditorShared.setSelectedMontage(m.id)
    levelEditorShared.setSelectedMontageDirection(m.direction)
  }

  useEffect(() => selectMontage(null), [collage])

  return {
    collage,
    get selectedMontage() {
      if (montageIndex === null) {
        return null
      }
      return collage.montages[montageIndex]
    },
    get realCollage() {
      return makeCollageFromFile(collage, true)
    },
    globalStuff: {
      scale: 1,
      server: levelEditorShared.globalStuff.server,
      userInputs: levelEditorShared.globalStuff.userInputs,
    },
    selectMontage,
  }
}

export default function LevelEditorTools(props: LevelEditorToolsProps) {
  const {
    editorGlobalStuff,
    levelEditorShared,
  } = props

  const collageViewHelper = useCollageViewHelper(levelEditorShared)

  const level = levelEditorShared.level
  const mode = levelEditorShared.mode

  async function launchCollageFileBrowser(): Promise<void> {
    const filePath = await editorGlobalStuff.openFileSelect("")
    const prefixRegex = /^\//
    const suffixRegex = /\.clg\.yml$/
    const collageId = filePath.replace(prefixRegex, "").replace(suffixRegex, "")
    levelEditorShared.selectCollage(collageId)
  }
  function selectModeOption(mode: Mode): void {
    levelEditorShared.setMode(mode)
  }
  function selectTraceOption(type: TraceTypeType): void {
    levelEditorShared.setMode("trace")
    levelEditorShared.setSelectedTraceType(type)
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
            {levelEditorShared.selectedTraceType === traceOption.type && ">> "}
          { traceOption.type }
        </div>
      ))}
    </div>}
    {(mode === 'prop' || mode === 'position') && <div className="collage-tool">
      <input
        value={levelEditorShared.selectedCollageId ?? ""}
        onDblClick={onlyLeft(launchCollageFileBrowser)}
        placeholder="Select a collage..."
        readonly={true}
        className="block pointer"
      />
      {collageViewHelper !== null && <CollageShowcase
        collageViewHelper={collageViewHelper}
        style="padding: 5px;"
      />}
    </div>}
  </div>
}