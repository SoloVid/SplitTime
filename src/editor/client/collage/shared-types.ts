namespace splitTime.editor.collage {
    export const EDITOR_PADDING = 32
    export const MIN_FRAME_LEN = 12

    export interface CollageEditorShared {
        readonly collage: file.Collage
        gridCell: Vector2D
        gridEnabled: boolean
        readonly realCollage: splitTime.Collage
        selectedFrame: file.collage.Frame | null
        selectedMontage: file.collage.Montage | null
        readonly server: client.ServerLiaison
        readonly time: game_seconds
        // propertiesPaneStuff: client.ObjectProperties
        /** Stuff to display to the user */
        readonly info: { [name: string]: string | number }
        follow(follower: client.Followable): void
        selectMontage(montage: file.collage.Montage): void
        trackFrame(frame: file.collage.Frame, point?: Coordinates2D): void
    }
}