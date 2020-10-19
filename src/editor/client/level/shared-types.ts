namespace splitTime.editor.level {
    export const EDITOR_PADDING = 32

    export type Mode = "position" | "prop" | "trace"
    
    export interface LevelEditorShared {
        activeLayer: number
        readonly mode: Mode
        readonly typeSelected: string
        readonly level: Level
        readonly server: client.ServerLiaison
        readonly time: game_seconds
        pathInProgress: splitTime.level.file_data.Trace | null
        propertiesPaneStuff: client.ObjectProperties
        /** Stuff to display to the user */
        readonly info: { [name: string]: string | number }
        setMode(mode: Mode, subType?: string): void
        shouldDragBePrevented(): boolean
        follow(follower: client.Followable): void
    }
}