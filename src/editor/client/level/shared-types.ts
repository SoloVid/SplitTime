namespace splitTime.editor.level {
    export const EDITOR_PADDING = 32

    export const TRACE_ICON = "draw-polygon"
    export const POSITION_ICON = "street-view"
    export const PROP_ICON = "tree"

    export type Mode = "position" | "prop" | "trace"

    export interface LevelEditorShared {
        activeGroup: int
        readonly collageManager: CollageManager
        gridCell: Vector2D
        gridEnabled: boolean
        /** Stuff to display to the user */
        readonly info: { [name: string]: string | number }
        readonly level: Level
        mode: Mode
        pathInProgress: splitTime.level.file_data.Trace | null
        selectedTraceType: string
        selectedCollage: string
        selectedMontage: string
        selectedMontageDirection: string
        selectedMontageObject: file.collage.Montage | null
        readonly server: client.ServerLiaison
        readonly time: game_seconds
        follow(follower: client.Followable): void
        shouldDragBePrevented(): boolean
        editProperties(propertiesSpec: client.ObjectProperties): void
    }
}