namespace splitTime.level {
    export interface FileData {
        /** @deprecated this feels broken */
        fileName: string
        type: "action"
        region: string
        width: int
        height: int
        background: string
        backgroundOffsetX: int
        backgroundOffsetY: int
        layers: file_data.Layer[]
        traces: file_data.Trace[]
        props: file_data.Prop[]
        positions: file_data.Position[]
    }

    // Expect compiler error if FileData is not jsonable
    let testFileDataJsonable: file.IsJsonable<FileData, false> = {} as FileData

    export namespace file_data {
        export interface Layer {
            id: string
            z: number
        }

        export interface Trace {
            id: string
            type: string
            vertices: string
            z: number
            height: number
            direction: string // for stairs
            event: string // for events
            level: string // for pointers
            offsetX: number // for pointers
            offsetY: number // for pointers
            offsetZ: number // for pointers
        }

        export interface Prop {
            id: string
            template: string
            x: number
            y: number
            z: number
            dir: string
            stance: string
            // FTODO: clean up
            playerOcclusionFadeFactor: null | number
        }

        export interface Position {
            id: string
            template: string
            x: number
            y: number
            z: number
            dir: string
            stance: string
        }
    }
}
