import { COLLAGE_DIR } from "engine/assets/assets"
import { Collage, makeCollageFromFile } from "engine/graphics/collage"
import { game_seconds } from "engine/time/timeline"
import { assert } from "globals"
import { useState } from "preact/hooks"
import { SharedStuffViewOnly as CollageSharedStuff } from "../collage/collage-editor-shared"
import CollageShowcase from "../collage/collage-showcase"
import { FileCollage, FileMontage } from "../file-types"
import { makeClassNames, onlyLeft } from "../preact-help"
import { ServerLiaison } from "../server-liaison"
import { GlobalEditorShared } from "../shared-types"
import { traceOptions } from "../trace-options"
import { SharedStuff } from "./level-editor-shared"
import { LevelEditorShared, Mode, POSITION_ICON, PROP_ICON, TRACE_ICON } from "./shared-types"

type LevelEditorToolsProps = {
  editorGlobalStuff: GlobalEditorShared
  levelEditorShared: SharedStuff
}

function useCollageViewHelper(levelEditorShared: SharedStuff): CollageSharedStuff | null {
  const [montageIndex, setMontageIndex] = useState<number | null>(null)

  const collage = levelEditorShared.selectedCollage
  if (collage === null) {
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
    get realCollage() {
      return makeCollageFromFile(collage, true)
    },
    globalStuff: {
      server: levelEditorShared.globalStuff.server,
      time: levelEditorShared.globalStuff.time,
      userInputs: levelEditorShared.globalStuff.userInputs,
    },
    selectMontage: setMontageIndex,
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
    const filePath = await editorGlobalStuff.openFileSelect(COLLAGE_DIR)
    const prefixRegex = new RegExp("^/?" + COLLAGE_DIR + "/?")
    const suffixRegex = /\.json$/
    const collageId = filePath.replace(prefixRegex, "").replace(suffixRegex, "")
    levelEditorShared.selectCollage(collageId)
  }
  function selectModeOption(mode: Mode): void {
    levelEditorShared.setMode(mode)
  }
  function selectTraceOption(type: string): void {
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
    <div className="trace-type-options" v-show="mode === 'trace'">
      {traceOptions.map((traceOption) => (
        <div
          key={traceOption.type}
          className="option"
          style={`color: white; background-color: ${traceOption.color}`}
          onClick={() => selectTraceOption(traceOption.type)}
          title={traceOption.help}
        >
          { traceOption.type }
        </div>
      ))}
    </div>
    <div className="collage-tool" v-show="mode === 'prop' || mode === 'position'">
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
    </div>
  </div>
}