import { useContext, useMemo } from "preact/hooks"
import { makeStyleString } from "../utils/preact-help"
import { imageContext } from "../common/server-liaison"
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
  const backgroundSize = {
    width: level.width * scale,
    height: level.height * scale,
  }

  const containerStyleMap = {
    position: 'absolute',
    left: EDITOR_PADDING + 'px',
    top: EDITOR_PADDING + 'px',
    width: backgroundSize.width + 'px',
    height: backgroundSize.height + 'px',
    overflow: "hidden",
    outline: "2px dashed black",
  }
  const containerStyle = makeStyleString(containerStyleMap)

  const backgroundStyle = useMemo(() => {
    const leftPadding = level.backgroundOffsetX * scale
    const topPadding = level.backgroundOffsetY * scale
    const styleMap = {
      position: 'absolute',
      left: leftPadding + 'px',
      top: topPadding + 'px',
      width: scaledSize ? scaledSize.width + 'px' : "0",
      height: scaledSize ? scaledSize.height + 'px' : "0",
    }
    return makeStyleString(styleMap)
  }, [level, scale, scaledSize])

  return <div style={containerStyle}>
    {!!backgroundSrc && <img className="background" src={backgroundSrc} style={backgroundStyle} />}
  </div>
}
