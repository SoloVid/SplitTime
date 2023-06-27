import { useEffect, useMemo, useRef, useState } from "preact/hooks"

type Props = {
  debugLabel?: string
}

const n = 3

export default function RenderCounter({ debugLabel }: Props) {
  const [arbitraryStateForChange, setArbitraryStateForChange] = useState<number>(0)
  const rendersThisSec = useRef<number>(0)
  const rendersLastNSec = useRef<readonly (number | null)[]>([])

  rendersThisSec.current++

  useEffect(() => {
    rendersLastNSec.current = (new Array(n)).fill(null)
  }, [])

  useEffect(() => {
    const handle = setInterval(() => {
      const [oldest, ...rest] = rendersLastNSec.current
      rendersLastNSec.current = [...rest, rendersThisSec.current]
      // Don't count the direct next render.
      rendersThisSec.current = -1

      // Force a re-render.
      setArbitraryStateForChange(Math.random())
    }, 1000)
    return (() => clearInterval(handle))
  }, [])

  const averageDenominator = useMemo(() => rendersLastNSec.current.filter(e => e !== null).length, [rendersLastNSec.current])
  const averageFramesPerSecond = useMemo(
    () => rendersLastNSec.current.reduce(
      (soFar: number, count) => count === null ? soFar : soFar + count, 0
    ) / averageDenominator || 1,
    [rendersLastNSec.current]
  )

  return <div className="render-counter">
    {debugLabel && <div>{debugLabel}</div>}
    {averageFramesPerSecond.toFixed(1)}/s
  </div>
}