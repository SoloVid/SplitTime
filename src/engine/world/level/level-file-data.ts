namespace splitTime.level {
    export interface FileData {
        fileName: string
        type: "action"
        region: string
        background: string
        traces: file_data.Trace[]
        props: file_data.Prop[]
        positions: file_data.Position[]
    }

    export namespace file_data {
        export interface Trace {
            id: string
            type: string
            vertices: string
            z: number | string
            height: number | string
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
            x: number | string
            y: number | string
            z: number | string
            dir: string
            stance: string
            // FTODO: clean up
            playerOcclusionFadeFactor: undefined | string
        }

        export interface Position {
            id: string
            x: number | string
            y: number | string
            z: number | string
            dir: string
            stance: string
        }
    }
}
