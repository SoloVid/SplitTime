// export const debug = console.log.bind(console);
// export const warn = console.warn.bind(console);
// export const error = console.error.bind(console);

import { generateUID } from "./misc"

export type LogListener = {
  onDebug?: (...args: readonly unknown[]) => void
  onWarn?: (...args: readonly unknown[]) => void
  onError?: (...args: readonly unknown[]) => void
}

type LoggerState = {
  id: string
  listeners: LogListener[]
}

const maybeWindow = typeof window !== "undefined" ? window as unknown as { _loggerState?: LoggerState } : undefined

const loggerState: LoggerState = maybeWindow?._loggerState ?? { id: generateUID(), listeners: [] }
if (maybeWindow) {
  maybeWindow._loggerState = loggerState
}

export const debug = (...args: readonly unknown[]) => {
  console.log(...args)
  for (const l of loggerState.listeners) {
    l.onDebug?.(...args)
  }
}
export const warn = (...args: readonly unknown[]) => {
  console.warn(...args)
  for (const l of loggerState.listeners) {
    l.onWarn?.(...args)
  }
}
export const error = (...args: readonly unknown[]) => {
  console.error(...args)
  for (const l of loggerState.listeners) {
    l.onError?.(...args)
  }
}

export function registerLogListener(listener: LogListener) {
  loggerState.listeners.push(listener)
}
export function unregisterLogListener(listener: LogListener) {
  const index = loggerState.listeners.indexOf(listener)
  if (index >= 0) {
    loggerState.listeners.splice(index, 1)
  }
}
