import { Vector2D } from "api/math"
import { Collage, Frame, Montage, MontageFrame } from "engine/file/collage"
import { Collage as RealCollage } from "engine/graphics/collage"
import { game_seconds } from "engine/time/timeline"
import { Trace as FileTrace } from "engine/world/level/level-file-data"
import { Coordinates2D } from "engine/world/level/level-location"
import { ObjectProperties } from "../field-options"
import { ServerLiaison } from "../server-liaison"
import { Followable } from "../shared-types"

export const EDITOR_PADDING = 32
export const MIN_FRAME_LEN = 12

// export interface IVueCollageViewHelper {
//     readonly collage: Collage
//     readonly realCollage: RealCollage
//     readonly selectedMontage: Montage | null
//     readonly server: ServerLiaison
//     readonly time: game_seconds
//     selectMontage(montage: Montage): void
// }

// export interface IVueCollageEditHelper {
//     readonly collage: Collage
//     gridCell: Vector2D
//     gridEnabled: boolean
//     selectedFrame: Frame | null
//     selectedMontage: Montage | null
//     traceInProgress: FileTrace | null
//     traceTypeSelected: string
//     /** Stuff to display to the user */
//     readonly info: { [name: string]: string | number }
//     editProperties(propertiesSpec: ObjectProperties): void
//     follow(follower: Followable): void
//     selectFrame(frame: Frame, andProperties: boolean): void
//     selectMontage(montage: Montage, andProperties: boolean): void
//     selectMontageFrame(montageFrame: MontageFrame, andProperties: boolean): void
//     trackFrame(frame: Frame, point?: Coordinates2D): void
// }

// // TypeScript docs suggest using inheritance with interfaces instead of intersection types
// export interface CollageEditorShared extends IVueCollageViewHelper, IVueCollageEditHelper {
//     selectedMontage: Montage | null
//     selectMontage(montage: Montage, andProperties?: boolean): void
// }

// export interface PropertiesEvent {
//     propertiesPanelSet?: boolean
// }
