import { createContext } from "preact";
import { useEffect, useState } from "preact/hooks";

export const Time = createContext<number>(0)

export function TimeProvider({ children }: { children: any }) {
  const [time, setTime] = useState(0)
  
  useEffect(() => {
    const TIME_INTERVAL = 50;
    setInterval(function() {
      setTime((oldTime) => oldTime += TIME_INTERVAL / 1000)
    }, TIME_INTERVAL);
  }, [])

  return (
    <Time.Provider value={time}>
      {children}
    </Time.Provider>
  )
}
