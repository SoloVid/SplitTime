namespace splitTime.level {
    export interface FileData {
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
            collage: string
            parcel: string
            x: number
            y: number
            z: number
            dir: string
            // FTODO: clean up
            playerOcclusionFadeFactor: number
        }

        export interface Position {
            id: string
            collage: string
            parcel: string
            x: number
            y: number
            z: number
            dir: string
        }
    }

    export namespace instanceOf {
        export function FileData(thing: unknown): thing is FileData {
            return type.isA(thing, type.object<level.FileData>({
                type: type.other<"action">(t => t === "action"),
                region: type.string,
                width: type.int,
                height: type.int,
                background: type.string,
                backgroundOffsetX: type.int,
                backgroundOffsetY: type.int,
                layers: type.array(type.object({
                    id: type.string,
                    z: type.number
                })),
                traces: type.array(type.object({
                    id: type.string,
                    type: type.string,
                    vertices: type.string,
                    z: type.number,
                    height: type.number,
                    direction: type.string,
                    event: type.string,
                    level: type.string,
                    offsetX: type.number,
                    offsetY: type.number,
                    offsetZ: type.number
                })),
                props: type.array(type.object({
                    id: type.string,
                    collage: type.string,
                    parcel: type.string,
                    x: type.number,
                    y: type.number,
                    z: type.number,
                    dir: type.string,
                    playerOcclusionFadeFactor: type.number
                })),
                positions: type.array(type.object({
                    id: type.string,
                    collage: type.string,
                    parcel: type.string,
                    x: type.number,
                    y: type.number,
                    z: type.number,
                    dir: type.string
                }))
            }))
        }
    }
}
