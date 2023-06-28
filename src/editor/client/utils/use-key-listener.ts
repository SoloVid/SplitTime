import { useEffect } from "preact/hooks"

export function useKeyListener(event: "keydown" | "keyup", handler: (e: KeyboardEvent) => void) {
  useEffect(() => {
    window.addEventListener(event, handler)
    return () => {
      window.removeEventListener(event, handler)
    }
  })
}
