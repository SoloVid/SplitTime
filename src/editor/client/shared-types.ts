namespace splitTime.editor {
    export namespace client {
        export interface Followable {
            shift(dx: number, dy: number): void
        }

        export interface VueComponent {
            $el: HTMLElement | undefined
            $refs: { [ key: string ]: HTMLElement }
            $emit(eventId: string, ...rest: unknown[]): void
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
    export namespace level {
        export const EDITOR_PADDING = 32

        export type Mode = "position" | "prop" | "trace"
        
        export interface GlobalEditorShared {
            readonly server: client.ServerLiaison
            setFollowers(newFollowers: client.Followable[]): void
        }

        export interface LevelEditorShared {
            activeLayer: number
            readonly mode: Mode
            readonly typeSelected: string
            readonly level: Level
            readonly server: client.ServerLiaison
            pathInProgress: splitTime.level.file_data.Trace | null
            propertiesPaneStuff: ObjectProperties
            /** Stuff to display to the user */
            readonly info: { [name: string]: string | number }
            setMode(mode: Mode, subType?: string): void
            shouldDragBePrevented(): boolean
            follow(follower: client.Followable): void
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
}