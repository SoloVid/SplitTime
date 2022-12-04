import { Coordinates2D } from "api"
import { generateUID } from "engine/utils/misc"
import { useState } from "preact/hooks"
import { getCoords } from "./editor-functions"
import { ServerLiaison } from "./server-liaison"

export interface Followable {
  shift(dx: number, dy: number): void
}

export interface VueComponent {
  $el: HTMLElement | undefined
  $refs: { [ key: string ]: HTMLElement }
  $emit(eventId: string, ...rest: unknown[]): void
}

export interface GlobalEditorShared {
  readonly gridEnabled: boolean
  readonly gridCell: { readonly x: number, readonly y: number }
  /** Zoom multiplier. (1 is actual size) */
  readonly scale: number
  readonly server: ServerLiaison
  /** Note: Mouse values NOT scaled by zoom. */
  readonly userInputs: UserInputs
  openFileSelect(rootDirectory: string): PromiseLike<string>
  setFollowers(newFollowers: Followable[]): void
  setOnDelete(callback: () => void): void
  setOnSettings(callback: () => void): void
}

export type UserInputs = {
  readonly mouse: {
    readonly x: number,
    readonly y: number,
    readonly isDown: boolean
  }
  readonly ctrlDown: boolean
}

export function getRelativeMouse(userInputs: UserInputs, $el: HTMLElement): Coordinates2D {
  const pos = getCoords($el)
  return {
    x: Math.round(userInputs.mouse.x - pos.left),
    y: Math.round(userInputs.mouse.y - pos.top),
  }
}

export interface EditorSupervisorControl {
  triggerSettings(): void
}

export class EditorMetadata {
  readonly displayed: boolean = true
  readonly editorId: string = generateUID()
  readonly highlighted: boolean = false
  readonly locked: boolean = false
}

export function withMetadata<TypeString, T>(type: TypeString, obj: T): ObjectWithEditorMetadata<TypeString, T> {
  return new ObjectWithEditorMetadata(type, obj)
}

export class ObjectWithEditorMetadata<TypeString, T> {
  constructor(
    public type: TypeString,
    public obj: T,
    public metadata: EditorMetadata = new EditorMetadata()
  ) {}
}

export function useObjectWithEditorMetadata<TypeString, T>(type: TypeString, obj: T) {
  const [metadata, setMetadata] = useState(new EditorMetadata())
  return {
    type,
    obj,
    metadata,
    setMetadata,
  }
}
