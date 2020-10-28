namespace splitTime.editor.collage {
    export const EDITOR_PADDING = 32
    export const MIN_FRAME_LEN = 12

    export interface IVueCollageViewHelper {
        readonly collage: file.Collage
        readonly realCollage: splitTime.Collage
        readonly selectedMontage: file.collage.Montage | null
        readonly server: client.ServerLiaison
        readonly time: game_seconds
        selectMontage(montage: file.collage.Montage): void
    }

    export interface IVueCollageEditHelper {
        readonly collage: file.Collage
        gridCell: Vector2D
        gridEnabled: boolean
        selectedFrame: file.collage.Frame | null
        selectedMontage: file.collage.Montage | null
        /** Stuff to display to the user */
        readonly info: { [name: string]: string | number }
        editProperties(propertiesSpec: client.ObjectProperties): void
        follow(follower: client.Followable): void
        selectFrame(frame: file.collage.Frame, andProperties: boolean): void
        selectMontage(montage: file.collage.Montage, andProperties: boolean): void
        selectMontageFrame(montageFrame: file.collage.MontageFrame, andProperties: boolean): void
        trackFrame(frame: file.collage.Frame, point?: Coordinates2D): void
    }

    export type CollageEditorShared = IVueCollageViewHelper & IVueCollageEditHelper

    export interface PropertiesEvent {
        propertiesPanelSet?: boolean
    }
}