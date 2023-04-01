import { Inputs, useEffect, useState } from "preact/hooks"

export const inactivityMs = 1000

export function useSetIntervalWhenActive(callback: () => void, ms: number, inputs: Inputs) {
  const [lastMouse, setLastMouse] = useState(0)

  useEffect(() => {
    const move = () => setLastMouse(getNow())
    const out = () => setLastMouse(0)
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseout", out)
    return () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseout", out)
    }
  }, [setLastMouse])
  
  useEffect(() => {
    const handle = setInterval(function() {
      if (document.visibilityState === "visible" && (document.hasFocus() || lastMouse + inactivityMs > getNow())) {
        callback()
      }
    }, ms)
    return () => {
      clearInterval(handle)
    }
  }, [lastMouse, ...inputs])
}

function getNow() {
  return (new Date()).getTime()
}
