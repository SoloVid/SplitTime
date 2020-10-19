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
        readonly server: client.ServerLiaison
        readonly time: game_seconds
        setFollowers(newFollowers: client.Followable[]): void
    }

    export type UserInputs = {
        mouse: {
            x: number,
            y: number,
            isDown: boolean
        }
        ctrlDown: boolean
    }

    export interface EditorSupervisorControl {
        triggerSettings(): void
    }
}