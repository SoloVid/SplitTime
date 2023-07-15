import { Montage } from "engine/file/collage"
import { useContext, useMemo } from "preact/hooks"
import { FileCollage, FileMontageFrame } from "../file-types"
import { CollageEditorPreferencesContext } from "./collage-preferences"
import MontageFrame from "./montage-frame"
import { PropertiesEvent } from "./shared-types"
import { CollageEditorControls } from "./collage-editor-shared"
import { Collage as RealCollage } from "engine/graphics/collage"

type MontageEditorProps = {
  collage: FileCollage
  controls: Pick<CollageEditorControls, "selectMontageFrame">
  montage: Montage
  realCollage: RealCollage
  scale: number
  traceIdInProgress: string | null
}

export default function MontageEditor(props: MontageEditorProps) {
  const {
    collage,
    controls,
    montage,
    realCollage,
    scale,
    traceIdInProgress,
  } = props

  const [collagePrefs, setCollagePrefs] = useContext(CollageEditorPreferencesContext)

  const selectedFrameId = collagePrefs.frameSelected
  const selectedFrame = useMemo(() => {
    if (!selectedFrameId) {
      return null
    }
    for (const f of collage.frames) {
      if (selectedFrameId === f.id) {
        return f
      }
    }
    return null
  }, [])

  const widestFrameWidth = useMemo(() => {
    return montage.frames
      .map(mf => collage.frames.find(f => mf.frame === f.name))
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

  function selectFrame(montageFrame: FileMontageFrame, event: MouseEvent): void {
    if (traceIdInProgress) {
      return
    }
    controls.selectMontageFrame(collage, montageFrame, (event as PropertiesEvent).propertiesPanelSet)
  }

return <div class="standard-margin standard-padding transparency-checkerboard-background" style={gridStyle}>
  {montage.frames.length === 0 && <div>
    Double-click a frame to add it to this montage.
  </div>}
  {montage.frames.map((mf) => (
    <div
      onMouseDown={(e) => { if (e.button === 0) selectFrame(mf, e) }}
    >
      <MontageFrame
        collage={collage}
        editAffectsAllFrames={false}
        highlight={mf.frame === selectedFrame?.name}
        montage={montage}
        montageFrame={mf}
        realCollage={realCollage}
        scale={scale}
      />
    </div>
  ))}
</div>
}