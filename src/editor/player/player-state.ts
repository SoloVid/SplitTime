export type PlayerState = {
  readonly consoleDrawer: ConsoleDrawerState
  readonly popup: PopupState
}

export type ConsoleDrawerState = {
  readonly isVisible: boolean
  readonly height: number
  readonly entries: readonly ConsoleEntry[]
}

export type ConsoleEntry = {
  readonly entryType: "info" | "warning" | "error" | "in" | "out"
  readonly text: string
}

export type PopupState = {
  readonly isVisible: boolean
  readonly messageType: "success" | "error" | "info"
  readonly htmlContent: string
}
