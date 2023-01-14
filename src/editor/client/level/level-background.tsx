import { useContext, useMemo } from "preact/hooks"
import { makeStyleString } from "../preact-help"
import { imageContext } from "../server-liaison"
import { EditorLevel } from "./extended-level-format"
import { EDITOR_PADDING } from "./shared-types"

type Props = {
  level: EditorLevel
}

export default function LevelBackground({level}: Props) {
  const projectImages = useContext(imageContext)
  const backgroundSrc = projectImages.imgSrc(level.background)

  const backgroundStyle = useMemo(() => {
    const leftPadding = EDITOR_PADDING + level.backgroundOffsetX
    const topPadding = EDITOR_PADDING + level.backgroundOffsetY
    const styleMap = {
      position: 'absolute',
      left: leftPadding + 'px',
      top: topPadding + 'px'
    }
    return makeStyleString(styleMap)
  }, [level])

  return <>{!!backgroundSrc && <img className="background" src={backgroundSrc} style={backgroundStyle} />}</>
}
