namespace splitTime.editor.collage {
    export const EDITOR_PADDING = 32

    export interface CollageEditorShared {
        readonly collage: file.Collage
        readonly realCollage: splitTime.Collage
        readonly server: client.ServerLiaison
        readonly time: game_seconds
        // propertiesPaneStuff: client.ObjectProperties
        /** Stuff to display to the user */
        readonly info: { [name: string]: string | number }
        // follow(follower: client.Followable): void
    }
}