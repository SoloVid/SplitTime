import { createContext } from "preact";
import { useState } from "preact/hooks";
import { useSetIntervalWhenActive } from "./utils/use-set-interval-when-active";

export const Time = createContext<number>(0)

export function TimeProvider({ children }: { children: any }) {
  const [time, setTime] = useState(0)

  const TIME_INTERVAL = 50;
  useSetIntervalWhenActive(() => {
    setTime((oldTime) => oldTime += TIME_INTERVAL / 1000)
  }, TIME_INTERVAL, [])

  return (
    <Time.Provider value={time}>
      {children}
    </Time.Provider>
  )
}
