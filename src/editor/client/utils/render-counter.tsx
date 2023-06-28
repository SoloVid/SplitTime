import { useEffect, useMemo, useRef, useState } from "preact/hooks"

type Props = {
  debugLabel?: string
}

const n = 4
const interval = 500

export default function RenderCounter({ debugLabel }: Props) {
  const [arbitraryStateForChange, setArbitraryStateForChange] = useState<number>(0)
  const rendersThisInterval = useRef<number>(0)
  const rendersLastNIntervals = useRef<readonly (number | null)[]>([])

  rendersThisInterval.current++

  useEffect(() => {
    rendersLastNIntervals.current = (new Array(n)).fill(null)
  }, [])

  useEffect(() => {
    const handle = setInterval(() => {
      const [oldest, ...rest] = rendersLastNIntervals.current
      rendersLastNIntervals.current = [...rest, rendersThisInterval.current]
      // Don't count the direct next render.
      rendersThisInterval.current = -1

      // Force a re-render.
      setArbitraryStateForChange(Math.random())
    }, interval)
    return (() => clearInterval(handle))
  }, [])

  const averageDenominator = useMemo(() => rendersLastNIntervals.current.filter(e => e !== null).length, [rendersLastNIntervals.current])
  const averageFramesPerSecond = useMemo(
    () => rendersLastNIntervals.current.reduce(
      (soFar: number, count) => count === null ? soFar : soFar + count, 0
    ) / (averageDenominator || 1) * 1000 / interval,
    [rendersLastNIntervals.current]
  )

  return <div className="render-counter">
    {debugLabel && <div>{debugLabel}</div>}
    {averageFramesPerSecond.toFixed(1)}/s
  </div>
}