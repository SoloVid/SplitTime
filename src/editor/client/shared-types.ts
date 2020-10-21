namespace splitTime.editor.client {
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
        readonly server: client.ServerLiaison
        readonly time: game_seconds
        setFollowers(newFollowers: client.Followable[]): void
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
        const pos = getCoords(vueComponent.$el)
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
        editorId: string = splitTime.generateUID()
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
}