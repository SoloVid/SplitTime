import { Montage as FileMontage, MontageFrame as FileMontageFrame } from "engine/file/collage"
import { Collage as RealCollage } from "engine/graphics/collage"
import { Rect } from "engine/math/rect"
import { Immutable } from "engine/utils/immutable"
import { useContext, useMemo } from "preact/hooks"
import { imageContext } from "../common/server-liaison"
import { FileCollage } from "../file-types"
import { useScaledImageSize } from "../utils/image-size"
import { ImmutableSetter, makeStyleString, useLogValueChanged } from "../utils/preact-help"
import RenderCounter from "../utils/render-counter"
import MontageBody from "./montage-body"
import MontageFrameMouseTracking from "./montage-frame-mouse-tracking"
import { MontageFrameRelativeInputsContextProvider } from "./montage-frame-relative-inputs"
import MontageTraces from "./montage-traces"
import MontageFrameMouseEventsHandler from "./montage-frame-mouse-events-handler"

type MontageFrameProps = {
  collage: FileCollage
  editAffectsAllFrames: boolean
  highlight: boolean
  montage: Immutable<FileMontage>
  montageFrame: Immutable<FileMontageFrame>
  realCollage: RealCollage
  scale: number
  setCollage?: ImmutableSetter<FileCollage>
  traceIdInProgress?: string | null
  setTraceIdInProgress?: (id: string | null) => void
}

export default function MontageFrame(props: MontageFrameProps) {
  const {
    collage,
    highlight,
    montage,
    montageFrame,
    realCollage,
    scale,
    setCollage,
  } = props

  // console.log("re-render montage frame")

  const body = montage.body
  // useLogValueChanged("body", body)

  // useLogValueChanged("collage.montages", collage.montages)
  // useLogValueChanged("montage", montage)
  // useLogValueChanged("montageFrame", montageFrame)
  // useLogValueChanged("realCollage.montages", realCollage.montages)

  const frame = useMemo(() => {
    const montageIndex = collage.montages.indexOf(montage)
    const montageFrameIndex = montage.frames.indexOf(montageFrame)
    return realCollage.montages[montageIndex].frames[montageFrameIndex]
  }, [
    collage.montages,
    montage,
    montageFrame,
    realCollage.montages,
  ])
  // useLogValueChanged("frame", frame)

  const frameBoxS = useMemo(() => {
    return Rect.make(
      frame.box.x * scale,
      frame.box.y * scale,
      frame.box.width * scale,
      frame.box.height * scale,
    )
  }, [frame.box, scale])
  // useLogValueChanged("frameBoxS", frameBoxS)

  const frameTargetBox = useMemo(() => {
    return frame.getTargetBox(body)
  }, [frame, body])
  // useLogValueChanged("frameTargetBox", frameTargetBox)

  const frameTargetBoxS = useMemo(() => {
    return Rect.make(
      frameTargetBox.x * scale,
      frameTargetBox.y * scale,
      frameTargetBox.width * scale,
      frameTargetBox.height * scale,
    )
  }, [frameTargetBox, scale])

  const imageDivStyle = useMemo(() => {
    const styleMap = {
      position: 'relative',
      overflow: 'hidden',
      width: frameTargetBoxS.width + 'px',
      height: frameTargetBoxS.height + 'px',
      outline: highlight ? "4px solid red" : "none"
    }
    return makeStyleString(styleMap)
  }, [frameTargetBoxS, highlight])


  const projectImages = useContext(imageContext)
  const imgSrc = projectImages.imgSrc(collage.image)
  const scaledImageSize = useScaledImageSize(imgSrc, scale)

  // useLogValueChanged("collage", collage)
  // useLogValueChanged("frameBoxS", frameBoxS)
  // useLogValueChanged("imageDivStyle", imageDivStyle)
  // useLogValueChanged("imgSrc", imgSrc)
  // useLogValueChanged("montage", montage)
  // useLogValueChanged("montageFrame", montageFrame)
  // useLogValueChanged("scale", scale)
  // useLogValueChanged("scaledImageSize", scaledImageSize)
  // useLogValueChanged("setCollage", setCollage)

  // return useMemo(() => 
  return <div className="montage-frame" style="position: relative;">
    {/* <MontageFrameRelativeInputsContextProvider
      frameTargetBox={frameTargetBox}
      scale={scale}
    > */}
    <MontageFrameMouseEventsHandler frameTargetBox={frameTargetBox} {...props}>
      {/* <MontageFrameMouseTracking></MontageFrameMouseTracking> */}
      <div
        style={imageDivStyle}
      >
        <RenderCounter debugLabel="frame"></RenderCounter>
        <img
          src={imgSrc}
          width={scaledImageSize?.width}
          height={scaledImageSize?.height}
          //width=${scaledImageDimensions.x}px; height=${scaledImageDimensions.y}px;
          style={`position: absolute; left: ${-frameBoxS.x}px; top: ${-frameBoxS.y}px`}
        />
      </div>
      {/* <MontageTraces
        {...props}
      ></MontageTraces> */}
      {setCollage && <MontageBody
        {...props}
      ></MontageBody>}
    </MontageFrameMouseEventsHandler>
    {/* </MontageFrameRelativeInputsContextProvider> */}
  </div>
  // , [
  //   collage,
  //   frameBoxS,
  //   imageDivStyle,
  //   imgSrc,
  //   montage,
  //   montageFrame,
  //   scale,
  //   scaledImageSize,
  //   setCollage,
  // ])
}
