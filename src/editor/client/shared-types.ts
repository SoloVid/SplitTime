import { ServerLiaison } from "./server-liaison"

export interface GlobalEditorShared {
  readonly server: ServerLiaison
  // openFileSelect(rootDirectory: string, filter?: RegExp): PromiseLike<string>
  // setOnDelete(callback: () => void): void
  // setOnSettings(callback: () => void): void
}

// export interface EditorSupervisorControl {
//   triggerSettings(): void
// }
