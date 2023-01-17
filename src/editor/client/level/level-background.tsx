import { useContext, useMemo } from "preact/hooks"
import { makeStyleString } from "../preact-help"
import { imageContext } from "../server-liaison"
import { useScaledImageSize } from "../utils/image-size"
import { EditorLevel } from "./extended-level-format"
import { EDITOR_PADDING } from "./shared-types"

type Props = {
  level: EditorLevel
  scale: number
}

export default function LevelBackground({level, scale}: Props) {
  const projectImages = useContext(imageContext)
  const backgroundSrc = projectImages.imgSrc(level.background)
  const scaledSize = useScaledImageSize(backgroundSrc, scale)

  const backgroundStyle = useMemo(() => {
    const leftPadding = EDITOR_PADDING + (level.backgroundOffsetX * scale)
    const topPadding = EDITOR_PADDING + (level.backgroundOffsetY * scale)
    const styleMap = {
      position: 'absolute',
      left: leftPadding + 'px',
      top: topPadding + 'px',
      width: scaledSize ? scaledSize.width + 'px' : "0",
      height: scaledSize ? scaledSize.height + 'px' : "0",
    }
    return makeStyleString(styleMap)
  }, [level, scale, scaledSize])

  return <>{!!backgroundSrc && <img className="background" src={backgroundSrc} style={backgroundStyle} />}</>
}
