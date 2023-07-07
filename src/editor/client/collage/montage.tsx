import { SharedStuffViewOnly, SharedStuff } from "./collage-editor-shared"
import { Montage as FileMontage } from "engine/file/collage"
import { getPlaceholderImage } from "../editor-functions"
import { useContext, useEffect, useMemo } from "preact/hooks"
import { makeStyleString } from "../utils/preact-help"
import { PropertiesEvent } from "./shared-types"
import { Rect } from "engine/math/rect"
import MontageFrame from "./montage-frame"
import { Time } from "../time-context"
import { useJsonableMemo } from "../utils/use-jsonable-memo"
import RenderCounter from "../utils/render-counter"

type MontageProps = {
  collageEditHelper: SharedStuff | undefined
  collageViewHelper: SharedStuffViewOnly
  montageIndex: number
  montage: FileMontage
  maxWidth: number
  maxHeight: number
}

export default function Montage(props: MontageProps) {
  const {
    collageEditHelper,
    collageViewHelper,
    montageIndex,
    montage,
    maxWidth,
    maxHeight,
  } = props

  const time = useContext(Time)

  const placeholderImgSrc = getPlaceholderImage()

  debugField("montage", montage)
  debugField("collageViewHelper.realCollage", collageViewHelper.realCollage)

  const realMontage = useMemo(() => {
    const dir = montage.direction === "" ? undefined : montage.direction
    return collageViewHelper.realCollage.getMontage(montage.id, dir)
  }, [montage, collageViewHelper.realCollage])

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

  const editorScale = collageViewHelper.scale

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
      outline: montage === collageViewHelper.selectedMontage ? "4px solid red" : "none"
    }
    return makeStyleString(styleMap)
  }, [overallAreaS, montage, collageViewHelper.selectedMontage])


  function setActiveMontage(event: MouseEvent): void {
    const alsoSetProperties = !(event as PropertiesEvent).propertiesPanelSet
    if (!!collageEditHelper) {
      if (collageEditHelper.traceInProgress) {
        return
      }
      collageEditHelper.selectMontage(montageIndex, alsoSetProperties)
    } else {
      collageViewHelper.selectMontage(montageIndex)
    }
  }

  function debugField(field: string, value: unknown) {
    useEffect(() => {
      console.log(`${field} changed`)
    }, [value])
  }
  
  debugField("realMontage", realMontage)
  debugField("montage.frames", montage.frames)
  debugField("collageEditHelper", collageEditHelper)
  debugField("collageViewHelper", collageViewHelper)
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

      const element = <div
        style={frameDivStyle}
      >
        <MontageFrame
          collageEditHelper={collageEditHelper}
          collageViewHelper={collageViewHelper}
          editAffectsAllFrames={true}
          highlight={false}
          montageIndex={montageIndex}
          montage={montage}
          montageFrameIndex={data.index}
          montageFrame={data.fileFrame}
          scale={scale}
        />
      </div>
      return element
    })
  }, [realMontage, montage.frames, collageEditHelper, collageViewHelper, montageIndex, montage, overallAreaS, scale])

  const frameIndex = useMemo(() => {
    return realMontage.getFrameIndexAt(time)
  }, [realMontage, time])

  const currentFrameElement = frameIndex === null ? <div
      style="overflow: hidden; width: 100%; height: 100%;"
    >
      <img src={placeholderImgSrc}/>
    </div> : montageFrameElements[frameIndex]

  return <div
    onMouseDown={(e) => { if (e.button === 0) setActiveMontage(e) }}
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
