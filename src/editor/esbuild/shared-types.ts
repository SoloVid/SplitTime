import { assert, Coordinates2D } from "api"
import { Vector2D } from "api/math"
import { game_seconds } from "engine/time/timeline"
import { generateUID } from "engine/utils/misc"
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
    readonly gridCell: Vector2D
    readonly server: ServerLiaison
    readonly time: game_seconds
    createUndoPoint(): void
    openFileSelect(rootDirectory: string): PromiseLike<string>
    setFollowers(newFollowers: Followable[]): void
    setOnDelete(callback: () => void): void
}

export type UserInputs = {
    mouse: {
        x: number,
        y: number,
        isDown: boolean
    }
    ctrlDown: boolean
}

export function getRelativeMouse(userInputs: UserInputs, vueComponent: VueComponent): Coordinates2D {
    // if (!vueComponent.$el) {
    //     return {
    //         x: 0,
    //         y: 0
    //     }
    // }
    // const $pos = $(vueComponent.$el).position()
    assert(!!vueComponent.$el, "Element required")
    // TODO: getCoords
    // const pos = getCoords(vueComponent.$el)
    const pos = { left: 123, top: 456 }
    return {
        x: userInputs.mouse.x - pos.left,
        y: userInputs.mouse.y - pos.top
    }
}

export interface EditorSupervisorControl {
    triggerSettings(): void
}

export class EditorMetadata {
    displayed: boolean = true
    editorId: string = generateUID()
    highlighted: boolean = false
    locked: boolean = false
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
