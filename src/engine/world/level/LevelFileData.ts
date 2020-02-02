namespace SplitTime.level {
    export interface FileData {
        fileName: string
        type: "action"
        region: string
        background: string
        layers: file_data.Layer[]
        props: file_data.Prop[]
        positions: file_data.Position[]
    }

    export namespace file_data {
        export interface Layer {
            id: string
            z: number
            traces: Trace[]
        }

        export interface Trace {
            id: string
            type: string
            vertices: string
            height: string // for solid
            direction: string // for stairs
            event: string // for events
            level: string // for pointers
            offsetX: string // for pointers
            offsetY: string // for pointers
            offsetZ: string // for pointers
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
            playerOcclusionFadeFactor: undefined | string
        }

        export interface Position {
            id: string
            x: number
            y: number
            z: number
            dir: string
            stance: string
        }
    }
}
