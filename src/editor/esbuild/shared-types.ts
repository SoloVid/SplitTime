import { assert, Coordinates2D } from "api"
import { Vector2D } from "api/math"
import { game_seconds } from "engine/time/timeline"
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
    readonly server: ServerLiaison
    readonly userInputs: UserInputs
    createUndoPoint(): void
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
    // if (!vueComponent.$el) {
    //     return {
    //         x: 0,
    //         y: 0
    //     }
    // }
    // const $pos = $(vueComponent.$el).position()
    // assert(!!vueComponent.$el, "Element required")
    // TODO: getCoords
    const pos = getCoords($el)
    // const pos = { left: 123, top: 456 }
    return {
        x: userInputs.mouse.x - pos.left,
        y: userInputs.mouse.y - pos.top
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
