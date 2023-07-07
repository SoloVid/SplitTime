import { Montage, MontageFrame as FileMontageFrame } from "engine/file/collage"
import { useMemo } from "preact/hooks"
import { SharedStuff } from "./collage-editor-shared"
import MontageFrame from "./montage-frame"
import { PropertiesEvent } from "./shared-types"

type MontageEditorProps = {
  collageEditorShared: SharedStuff
  montageIndex: number
  montage: Montage
}

export default function MontageEditor(props: MontageEditorProps) {
  const {
    collageEditorShared,
    montageIndex,
    montage,
  } = props

  const collage = collageEditorShared.collage
  const scale = collageEditorShared.scale

  const selectedFrameId = collageEditorShared.selectedFrame === null ? null : collageEditorShared.selectedFrame.id

  const widestFrameWidth = useMemo(() => {
    return montage.frames
      .map(mf => collage.frames.find(f => mf.frameId === f.id))
      .reduce((maxWidth, f) => {
        return Math.max(maxWidth, f?.width ?? 0)
      }, 0)
  }, [montage.frames, collage.frames])
  const widestFrameWidthS = widestFrameWidth * scale

  const gridStyle = useMemo(() => {
    return {
      "position": "absolute",
      "width": "100%",
      "display": "grid",
      "grid-template-columns": "repeat(auto-fill, minmax(" + widestFrameWidthS + "px, 1fr))",
      "grid-gap": "0.5rem"
    }
  }, [widestFrameWidthS])

  function selectFrame(montageFrameIndex: number, event: MouseEvent): void {
    if (collageEditorShared.traceInProgress) {
      return
    }
    collageEditorShared.selectMontageFrame(montageIndex, montageFrameIndex, !(event as PropertiesEvent).propertiesPanelSet)
  }

return <div class="standard-margin standard-padding transparency-checkerboard-background" style={gridStyle}>
  {montage.frames.length === 0 && <div>
    Double-click a frame to add it to this montage.
  </div>}
  {montage.frames.map((frame, iFrame) => (
    <div
      onMouseDown={(e) => { if (e.button === 0) selectFrame(iFrame, e) }}
    >
      <MontageFrame
        collageEditHelper={collageEditorShared}
        collageViewHelper={collageEditorShared}
        editAffectsAllFrames={false}
        highlight={frame.frameId === selectedFrameId}
        montageIndex={montageIndex}
        montage={montage}
        montageFrameIndex={iFrame}
        montageFrame={frame}
        scale={scale}
      />
    </div>
  ))}
</div>
}