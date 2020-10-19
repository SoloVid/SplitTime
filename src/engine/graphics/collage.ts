namespace splitTime {
    const DEFAULT_PARCEL_DIR = 9999
    export class Collage {
        private readonly parcelMap: { [id: string]: { [direction: number]: collage.Parcel }} = {}

        constructor(
            readonly image: string,
            readonly parcels: readonly Readonly<collage.Parcel>[],
            private readonly defaultParcelId: string
        ) {
            // Construct map
            for (const parcel of parcels) {
                const id = parcel.id
                if (!(id in this.parcelMap)) {
                    this.parcelMap[id] = {}
                }
                const dir = parcel.direction === null ? DEFAULT_PARCEL_DIR : parcel.direction
                this.parcelMap[id][dir] = parcel
            }
            // Make sure there is a default for each parcel
            for (const id in this.parcelMap) {
                const bucket = this.parcelMap[id]
                if (!(DEFAULT_PARCEL_DIR in bucket)) {
                    for (const dir in bucket) {
                        bucket[DEFAULT_PARCEL_DIR] = bucket[dir]
                        break
                    }
                }
            }

            if (!this.hasParcel(defaultParcelId)) {
                throw new Error("Default parcel " + defaultParcelId + " not found in collage")
            }
        }

        hasParcel(id: string): boolean {
            return id in this.parcelMap
        }

        getParcel(id: string, direction?: direction_t | string): collage.Parcel {
            if (!this.hasParcel(id)) {
                throw new Error("Parcel " + id + " not found in collage")
            }
            const bucket = this.parcelMap[id]
            const dirKey = direction === undefined ? DEFAULT_PARCEL_DIR :
                splitTime.direction.interpret(direction)
            if (dirKey in bucket) {
                return bucket[dirKey]
            }
            return bucket[DEFAULT_PARCEL_DIR]
        }

        getDefaultParcel(direction?: direction_t | string): collage.Parcel {
            return this.getParcel(this.defaultParcelId, direction)
        }
    }

    export namespace collage {
        export function makeCollageFromFile(file: file.Collage): Collage {
            const framesRectMap: { [id: string]: math.Rect } = {}
            for (const fileFrame of file.frames) {
                framesRectMap[fileFrame.id] =
                    math.Rect.make(fileFrame.x, fileFrame.y, fileFrame.width, fileFrame.height)
            }
            return new Collage(file.image, file.parcels.map(fileParcel => {
                const dir = !fileParcel.direction ? null :
                    splitTime.direction.interpret(fileParcel.direction)
                return new collage.Parcel(fileParcel.id,
                    dir,
                    fileParcel.frames.map(fpf => {
                        if (!(fpf.frameId in framesRectMap)) {
                            throw new Error("Could not find frame " + fpf.frameId +
                                " for parcel " + fileParcel.id)
                        }
                        return new collage.Frame(
                            framesRectMap[fpf.frameId],
                            new Coordinates2D(fpf.offsetX, fpf.offsetY),
                            fpf.duration
                        )
                    }),
                    fileParcel.body,
                    fileParcel.traces
                )
            }), file.defaultParcelId)
        }
    }
}