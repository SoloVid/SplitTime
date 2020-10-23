namespace splitTime.editor.level {
    export const EDITOR_PADDING = 32

    export type Mode = "position" | "prop" | "trace"
    
    export interface LevelEditorShared {
        activeLayer: number
        gridCell: Vector2D
        gridEnabled: boolean
        /** Stuff to display to the user */
        readonly info: { [name: string]: string | number }
        readonly level: Level
        readonly mode: Mode
        pathInProgress: splitTime.level.file_data.Trace | null
        propertiesPaneStuff: client.ObjectProperties
        readonly server: client.ServerLiaison
        readonly time: game_seconds
        readonly typeSelected: string
        follow(follower: client.Followable): void
        setMode(mode: Mode, subType?: string): void
        shouldDragBePrevented(): boolean
    }
}