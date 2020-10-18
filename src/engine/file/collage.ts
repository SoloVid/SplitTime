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
}