import { Vector2D } from "api/math"
import { Immutable } from "engine/utils/immutable"
import { generateUID } from "engine/utils/misc"
import { Coordinates2D } from "engine/world/level/level-location"
import { useMemo, useState } from "preact/hooks"
import { makeStyleString } from "./preact-help"

type GridLinesProps = {
  gridCell: Immutable<Coordinates2D>
  origin: Immutable<Coordinates2D>
}

export default function GridLines(props: GridLinesProps) {
  interface SvgGridSpec {
    width: number
    height: number
    pathD: string
  }

  const {
    gridCell,
    origin,
  } = props

  const [uid] = useState(generateUID())

  const styleObject = {
    "pointer-events": "none",
    position: "absolute",
    left: "0",
    top: "0"
  }

  const smallGrid = useMemo(() => {
    return {
      width: gridCell.x,
      height: gridCell.y,
      pathD: "M " + gridCell.x + " 0 L 0 0 0 " + gridCell.y
    }
  }, [gridCell])

  const THICK_AT = 10
  const fullGrid = useMemo<SvgGridSpec>(() => {
    const gridCellVector = new Vector2D(gridCell.x, gridCell.y)
    const bigCell = gridCellVector.times(THICK_AT)
    return {
      width: bigCell.x,
      height: bigCell.y,
      pathD: "M " + bigCell.x + " 0 L 0 0 0 " + bigCell.y
    }
  }, [gridCell])

  return <svg style={makeStyleString(styleObject)} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern
        id={'small-grid-' + uid}
        width={smallGrid.width}
        height={smallGrid.height}
        patternUnits="userSpaceOnUse"
      >
        <path d={smallGrid.pathD} fill="none" stroke="gray" stroke-width="0.5"/>
      </pattern>
      <pattern
        id={'grid-' + uid}
        width={fullGrid.width}
        height={fullGrid.height}
        patternUnits="userSpaceOnUse"
        x={origin.x}
        y={origin.y}
      >
        <rect
          width={fullGrid.width}
          height={fullGrid.height}
          fill={'url(#small-grid-' + uid + ')'}
        />
        <path d={fullGrid.pathD} fill="none" stroke="gray" stroke-width="1"/>
      </pattern>
    </defs>

    <rect width="100%" height="100%" fill={'url(#grid-' + uid + ')'} />
  </svg>
}