import { Montage as FileMontage } from "engine/file/collage"
import { Collage as RealCollage } from "engine/graphics/collage"
import { Rect } from "engine/math/rect"
import { useContext, useEffect, useMemo } from "preact/hooks"
import { getPlaceholderImage } from "../editor-functions"
import { FileCollage } from "../file-types"
import { Time } from "../time-context"
import { ImmutableSetter, makeStyleString, onlyLeft } from "../utils/preact-help"
import RenderCounter from "../utils/render-counter"
import { useJsonableMemo } from "../utils/use-jsonable-memo"
import { CollageEditorControls } from "./collage-editor-shared"
import MontageFrame from "./montage-frame"
import { PropertiesEvent } from "./shared-types"

type MontageProps = {
  collage: FileCollage
  controls?: Pick<CollageEditorControls, "selectMontage">
  montageIndex: number
  montage: FileMontage
  maxWidth: number
  maxHeight: number
  realCollage: RealCollage
  scale: number
  selectedMontage: FileMontage | null
  setCollage?: ImmutableSetter<FileCollage>
  setTraceIdInProgress?: (id: string | null) => void
  traceIdInProgress?: string | null
}

export default function Montage(props: MontageProps) {
  const {
    collage,
    controls,
    montageIndex,
    montage,
    maxWidth,
    maxHeight,
    realCollage,
    scale: editorScale,
    selectedMontage,
    setCollage,
    setTraceIdInProgress,
    traceIdInProgress,
  } = props

  const time = useContext(Time)

  const placeholderImgSrc = getPlaceholderImage()

  debugField("montage", montage)
  debugField("realCollage", realCollage)

  const realMontage = useMemo(() => {
    const dir = montage.direction === "" ? undefined : montage.direction
    return realCollage.getMontage(montage.id, dir)
  }, [montage, realCollage])

  const overallArea = useJsonableMemo(() => {
    if (montage.frames.length === 0) {
      // FTODO: Consider calculating these values better
      return Rect.make(0, 0, 16, 16)
    }
    const rect = realMontage.getOverallArea()
    return {
      width: rect.width,
      height: rect.height,
      x: rect.x,
      y: rect.y,
    }
  }, [montage, realMontage])

  const desiredWidth = overallArea.width * editorScale
  const desiredHeight = overallArea.height * editorScale

  const bestWidth = Math.min(maxWidth, desiredWidth)
  const bestHeight = Math.min(maxHeight, desiredHeight)

  const scale = Math.min(bestWidth / overallArea.width, bestHeight / overallArea.height)

  const overallAreaS = useMemo(() => Rect.make(
    overallArea.x * scale,
    overallArea.y * scale,
    overallArea.width * scale,
    overallArea.height * scale,
  ), [overallArea, scale])

  const containerStyle = useMemo(() => {
    const styleMap = {
      position: 'relative',
      width: overallAreaS.width + 'px',
      height: overallAreaS.height + 'px',
      outline: montage === selectedMontage ? "4px solid red" : "none"
    }
    return makeStyleString(styleMap)
  }, [overallAreaS, montage, selectedMontage])


  function setActiveMontage(event: MouseEvent): void {
    console.log("setActiveMontage()")
    console.log(traceIdInProgress, controls)
    const propertiesPanelSet = (event as PropertiesEvent).propertiesPanelSet
    if (!traceIdInProgress && controls) {
      controls.selectMontage(montage, propertiesPanelSet)
    }
  }

  function debugField(field: string, value: unknown) {
    useEffect(() => {
      console.log(`${field} changed`)
    }, [value])
  }
  
  debugField("realMontage", realMontage)
  debugField("montage.frames", montage.frames)
  debugField("collage", collage)
  debugField("realCollage", realCollage)
  debugField("montageIndex", montageIndex)
  debugField("montage", montage)
  debugField("overallAreaS", overallAreaS)
  debugField("scale", scale)

  const montageFrameElements = useMemo(() => {
    if (realMontage.frames.length === 0) {
      return []
    }
    return realMontage.frames.map((realFrame, frameIndex) => {
      const data = {
        index: frameIndex,
        fileFrame: montage.frames[frameIndex],
        targetBox: realFrame.getTargetBox(realMontage.bodySpec),
      }

      const targetBox = data.targetBox
      const targetBoxS = { x: targetBox.x * scale, y: targetBox.y * scale }
      const styleMap = {
        position: 'absolute',
        left: (targetBoxS.x - overallAreaS.x) + 'px',
        top: (targetBoxS.y - overallAreaS.y) + 'px'
      }
      const frameDivStyle = makeStyleString(styleMap)

      console.log("Recreate MontageFrame")
      const element = <div
        style={frameDivStyle}
      >
        <MontageFrame
          key={data.fileFrame.id}
          collage={collage}
          realCollage={realCollage}
          editAffectsAllFrames={true}
          highlight={false}
          montage={montage}
          montageFrame={data.fileFrame}
          scale={scale}
          setCollage={setCollage}
          setTraceIdInProgress={setTraceIdInProgress}
          traceIdInProgress={traceIdInProgress}
        />
      </div>
      return element
    })
  }, [realMontage, montage.frames, collage, realCollage, montageIndex, montage, overallAreaS, scale])

  const frameIndex = useMemo(() => {
    return realMontage.getFrameIndexAt(time)
  }, [realMontage, time])

  const currentFrameElement = frameIndex === null ? <div
      style="overflow: hidden; width: 100%; height: 100%;"
    >
      <img src={placeholderImgSrc}/>
    </div> : montageFrameElements[frameIndex]

  return <div
    onMouseDown={onlyLeft(setActiveMontage, true)}
    style="position: relative;"
  >
    <div
      style={containerStyle}
      class="transparency-checkerboard-background"
      title={montage.id + ' (' + montage.direction + ')'}
    >
      <RenderCounter offsetY={-36} debugLabel="montage"></RenderCounter>
      {currentFrameElement}
    </div>
  </div>
}
