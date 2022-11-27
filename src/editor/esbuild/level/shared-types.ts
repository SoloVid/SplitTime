import { Vector2D } from "engine/math/vector2d"
import { game_seconds } from "engine/time/timeline"
import { ObjectProperties } from "../field-options"
import { FileMontage, FileTrace } from "../file-types"
import { ServerLiaison } from "../server-liaison"
import { Followable } from "../shared-types"
import { CollageManager } from "./collage-manager"
import { Level } from "./extended-level-format"

export const EDITOR_PADDING = 32

export const TRACE_ICON = "draw-polygon"
export const POSITION_ICON = "street-view"
export const PROP_ICON = "tree"

export type Mode = "position" | "prop" | "trace"

export interface LevelEditorShared {
  activeGroup: string
  readonly collageManager: CollageManager
  gridCell: Vector2D
  gridEnabled: boolean
  /** Stuff to display to the user */
  readonly info: { [name: string]: string | number }
  readonly level: Level
  mode: Mode
  pathInProgress: FileTrace | null
  selectedTraceType: string
  selectedCollage: string
  selectedMontage: string
  selectedMontageDirection: string
  selectedMontageObject: FileMontage | null
  readonly server: ServerLiaison
  readonly time: game_seconds
  follow(follower: Followable): void
  shouldDragBePrevented(): boolean
  editProperties(propertiesSpec: ObjectProperties): void
}
