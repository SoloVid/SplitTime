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

    export interface EditorSupervisorControl {
        triggerSettings(): void
    }

    export type Mode = "position" | "prop" | "trace"
    
    export interface GlobalEditorShared {
        setFollowers(newFollowers: Followable[]): void
    }

    export interface LevelEditorShared {
        activeLayer: number
        readonly mode: Mode
        readonly typeSelected: string
        readonly level: Level
        pathInProgress: splitTime.level.file_data.Trace | null
        propertiesPaneStuff: ObjectProperties
        /** Stuff to display to the user */
        readonly info: { [name: string]: string | number }
        setMode(mode: Mode, subType?: string): void
        shouldDragBePrevented(): boolean
        follow(follower: Followable): void
    }

    export interface FieldOptions {
        readonly?: boolean
        title?: string
    }

    export interface ObjectProperties {
        title: string,
        thing: { [key: string]: string | number }
        fields: { [key: string]: FieldOptions }
    }
}