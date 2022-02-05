namespace splitTime.level {
    export interface FileData {
        type: "action"
        region: string
        width: int
        height: int
        background: string
        backgroundOffsetX: int
        backgroundOffsetY: int
        groups: file_data.Group[]
        traces: file_data.Trace[]
        props: file_data.Prop[]
        positions: file_data.Position[]
    }

    // Expect compiler error if FileData is not jsonable
    let testFileDataJsonable: file.IsJsonable<FileData, false> = {} as FileData
}
namespace splitTime.level.file_data {
    export interface Group {
        id: string
        parent: string
        defaultZ: number
        defaultHeight: number
    }

    export interface Trace {
        id: string
        group: string
        type: string
        vertices: string
        z: number
        height: number
        direction: string // for stairs
        event: string // for event
        level: string // for pointer/transport/send
        offsetX: number // for pointer/transport
        offsetY: number // for pointer/transport
        offsetZ: number // for pointer/transport
        targetPosition: string // for send
    }

    export interface Prop {
        id: string
        group: string
        collage: string
        montage: string
        x: number
        y: number
        z: number
        dir: string
    }

    /** Alias */
    export type Position = Prop
}

namespace splitTime.level {
    export function instanceOfFileData(thing: unknown): thing is FileData {
        return type.isA(thing, type.object<level.FileData>({
            type: type.other<"action">(t => t === "action"),
            region: type.string,
            width: type.int,
            height: type.int,
            background: type.string,
            backgroundOffsetX: type.int,
            backgroundOffsetY: type.int,
            groups: type.array(type.object({
                id: type.string,
                parent: type.string,
                defaultZ: type.number,
                defaultHeight: type.number
            })),
            traces: type.array(type.object({
                id: type.string,
                group: type.string,
                type: type.string,
                vertices: type.string,
                z: type.number,
                height: type.number,
                direction: type.string,
                event: type.string,
                level: type.string,
                offsetX: type.number,
                offsetY: type.number,
                offsetZ: type.number,
                targetPosition: type.string
            })),
            props: type.array(type.object({
                id: type.string,
                group: type.string,
                collage: type.string,
                montage: type.string,
                x: type.number,
                y: type.number,
                z: type.number,
                dir: type.string
            })),
            positions: type.array(type.object({
                id: type.string,
                group: type.string,
                collage: type.string,
                montage: type.string,
                x: type.number,
                y: type.number,
                z: type.number,
                dir: type.string
            }))
        }))
    }
}
