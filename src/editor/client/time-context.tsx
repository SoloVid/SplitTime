import { createContext } from "preact";
import { useEffect, useState } from "preact/hooks";

export const Time = createContext<number>(0)

export function TimeProvider({ children }: { children: any }) {
  const [time, setTime] = useState(0)
  const [mouseInDoc, setMouseInDoc] = useState(false)

  useEffect(() => {
    const over = () => setMouseInDoc(true)
    const out = () => setMouseInDoc(false)
    window.addEventListener("mouseover", over)
    window.addEventListener("mouseout", out)
    return () => {
      window.removeEventListener("mouseover", over)
      window.removeEventListener("mouseout", out)
    }
  }, [setMouseInDoc])
  
  useEffect(() => {
    const TIME_INTERVAL = 50;
    const handle = setInterval(function() {
      if (document.visibilityState === "visible" && (document.hasFocus() || mouseInDoc)) {
        setTime((oldTime) => oldTime += TIME_INTERVAL / 1000)
      }
    }, TIME_INTERVAL)
    return () => {
      clearInterval(handle)
    }
  }, [mouseInDoc])

  return (
    <Time.Provider value={time}>
      {children}
    </Time.Provider>
  )
}
