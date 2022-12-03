import { SharedStuffViewOnly, SharedStuff } from "./collage-editor-shared"
import { Montage as FileMontage } from "engine/file/collage"
import { getPlaceholderImage } from "../editor-functions"
import { useContext, useMemo } from "preact/hooks"
import { makeStyleString } from "../preact-help"
import { PropertiesEvent } from "./shared-types"
import { Rect } from "engine/math/rect"
import MontageFrame from "./montage-frame"
import { Time } from "../time-context"

type MontageProps = {
  collageEditHelper: SharedStuff | undefined
  collageViewHelper: SharedStuffViewOnly
  montageIndex: number
  montage: FileMontage
}

export default function Montage(props: MontageProps) {
  const {
    collageEditHelper,
    collageViewHelper,
    montageIndex,
    montage,
  } = props

  const time = useContext(Time)

  const placeholderImgSrc = getPlaceholderImage()

  const realMontage = useMemo(() => {
    const dir = montage.direction === "" ? undefined : montage.direction
    return collageViewHelper.realCollage.getMontage(montage.id, dir)
  }, [montage, collageViewHelper.realCollage])

  const currentFrame = useMemo(() => {
    if (realMontage.frames.length === 0) {
      return null
    }
    const realFrame = realMontage.getFrameAt(time)
    const frameIndex = realMontage.frames.indexOf(realFrame)
    return {
      index: frameIndex,
      fileFrame: montage.frames[frameIndex],
      targetBox: realFrame.getTargetBox(realMontage.bodySpec),
    }
  }, [realMontage, time, montage.frames])

  const overallArea = useMemo(() => {
    if (montage.frames.length === 0) {
      // FTODO: Consider calculating these values better
      return Rect.make(0, 0, 16, 16)
    }
    return realMontage.getOverallArea()
  }, [montage, realMontage])

  const containerStyle = useMemo(() => {
    const styleMap = {
      position: 'relative',
      width: overallArea.width + 'px',
      height: overallArea.height + 'px',
      outline: montage === collageViewHelper.selectedMontage ? "4px solid red" : "none"
    }
    return makeStyleString(styleMap)
  }, [overallArea, montage, collageViewHelper.selectedMontage])

  const frameDivStyle = useMemo(() => {
    const targetBox = currentFrame ? currentFrame.targetBox : { x: 16, y: 16 }
    const styleMap = {
      position: 'absolute',
      left: (targetBox.x - overallArea.x) + 'px',
      top: (targetBox.y - overallArea.y) + 'px'
    }
    return makeStyleString(styleMap)
  }, [currentFrame, overallArea])

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

  return <div
    onMouseDown={(e) => { if (e.button === 0) setActiveMontage(e) }}
  >
    <div
      style={containerStyle}
      class="transparency-checkerboard-background"
      title={montage.id + ' (' + montage.direction + ')'}
    >
      {!currentFrame && <div
        style="overflow: hidden; width: 100%; height: 100%;"
      >
        <img src={placeholderImgSrc}/>
      </div>}
      {currentFrame && <div
        style={frameDivStyle}
      >
        <MontageFrame
          collageEditHelper={collageEditHelper}
          collageViewHelper={collageViewHelper}
          editAffectsAllFrames={true}
          highlight={false}
          montageIndex={montageIndex}
          montage={montage}
          montageFrameIndex={currentFrame.index}
          montageFrame={currentFrame.fileFrame}
        />
      </div>}
    </div>
  </div>
}
