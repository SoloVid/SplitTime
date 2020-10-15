namespace splitTime.editor.level {
    export const EDITOR_PADDING = 32

    export interface Followable {
        shift(dx: number, dy: number): void
    }

    export interface VueComponent {
        $el: HTMLElement | undefined
        $refs: { [ key: string ]: HTMLElement }
    }

    export type UserInputs = {
        mouse: {
            x: number,
            y: number,
            isDown: boolean
        }
        ctrlDown: boolean
    }

    export type Mode = "position" | "prop" | "trace"
    
    export interface GlobalEditorShared {
        setFollowers(newFollowers: Followable[]): void
    }
    
    export interface LevelEditorShared {
        getLevel(): Level
        shouldDragBePrevented(): boolean
        follow(follower: Followable): void
    }
}