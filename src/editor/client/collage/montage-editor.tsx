import { Montage } from "engine/file/collage"
import { useContext, useMemo } from "preact/hooks"
import { FileCollage, FileMontageFrame } from "../file-types"
import { CollageEditorPreferencesContext } from "./collage-preferences"
import MontageFrame from "./montage-frame"
import { PropertiesEvent } from "./shared-types"
import { CollageEditorControls } from "./collage-editor-shared"
import { Collage as RealCollage } from "engine/graphics/collage"
import { ImmutableSetter, onlyLeft } from "../utils/preact-help"
import RenderCounter from "../utils/render-counter"

type MontageEditorProps = {
  collage: FileCollage
  controls: Pick<CollageEditorControls, "selectMontageFrame">
  montage: Montage
  realCollage: RealCollage
  scale: number
  setCollage: ImmutableSetter<FileCollage>
  setTraceIdInProgress: (id: string | null) => void
  traceIdInProgress: string | null
}

export default function MontageEditor(props: MontageEditorProps) {
  const {
    collage,
    controls,
    montage,
    realCollage,
    scale,
    setCollage,
    setTraceIdInProgress,
    traceIdInProgress,
  } = props

  const [collagePrefs, setCollagePrefs] = useContext(CollageEditorPreferencesContext)

  const widestFrameWidth = useMemo(() => {
    return montage.frames
      .map(mf => collage.frames.find(f => mf.frame === f.id))
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

  console.log("Rerender MontageEditor")
  return <div class="standard-margin standard-padding transparency-checkerboard-background" style={gridStyle}>
    <RenderCounter debugLabel="montage-editor"></RenderCounter>
    {montage.frames.length === 0 && <div>
      Double-click a frame to add it to this montage.
    </div>}
    {montage.frames.map((mf) => (
      <div
        onMouseDown={onlyLeft((e) => selectFrame(mf, e), true)}
      >
        <MontageFrame
          collage={collage}
          editAffectsAllFrames={false}
          highlight={collagePrefs.montageFrameSelected ? mf.id === collagePrefs.montageFrameSelected : mf.frame === collagePrefs.frameSelected}
          montage={montage}
          montageFrame={mf}
          realCollage={realCollage}
          scale={scale}
          setCollage={setCollage}
          setTraceIdInProgress={setTraceIdInProgress}
          traceIdInProgress={traceIdInProgress}
        />
      </div>
    ))}
  </div>
}