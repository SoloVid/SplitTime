namespace splitTime.file {
    export interface Collage {
        image: string
        frames: collage.Frame[]
        parcels: collage.Parcel[]
        defaultParcelId: string
    }

    // Expect compiler error if Collage is not jsonable
    let testCollageJsonable: IsJsonable<Collage, false> = {} as Collage

    export namespace collage {
        export interface Frame {
            id: string
            x: int
            y: int
            width: int
            height: int
        }

        // TBD name: parcel? animation? animated entity? setup? kit?
        export interface Parcel {
            id: string
            direction: string
            frames: ParcelFrame[]
            body: BodySpec
            traces: level.file_data.Trace[]
        }

        export interface ParcelFrame {
            frameId: string
            offsetX: int
            offsetY: int
            duration: game_seconds
        }

        export interface BodySpec {
            // along x axis
            width: int
            // along y axis
            depth: int
            // along z axis
            height: int
        }
    }

    export namespace instanceOf {
        export function Collage(thing: unknown): thing is file.Collage {
            return type.isA(thing, type.object<file.Collage>({
                image: type.string,
                frames: type.array(type.object({
                    id: type.string,
                    x: type.int,
                    y: type.int,
                    width: type.int,
                    height: type.int
                })),
                parcels: type.array(type.object({
                    id: type.string,
                    direction: type.string,
                    frames: type.array(type.object({
                        frameId: type.string,
                        offsetX: type.int,
                        offsetY: type.int,
                        duration: type.number
                    })),
                    body: type.object({
                        width: type.int,
                        depth: type.int,
                        height: type.int
                    }),
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
                    }))
                })),
                defaultParcelId: type.string
            }))
        }
        defer(() => {
            Collage({})
        })
    }
}