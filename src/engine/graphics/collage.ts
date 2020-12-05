namespace splitTime {
    const DEFAULT_MONTAGE_DIR = 9999
    /**
     * Image (e.g. sprite sheet or tile map) with a bunch of associated metadata.
     * 
     * A collage has a single image that is split up into a bunch of {@link Frame}s (boxes).
     * These boxes may then be combined into {@link Montage}s which are animations
     * combined with some physics metadata.
     */
    export class Collage {
        private readonly montageMap: { [id: string]: { [direction: number]: collage.Montage }} = {}

        constructor(
            /** Path of image backing this Collage */
            readonly image: string,
            readonly montages: readonly Readonly<collage.Montage>[],
            private readonly defaultMontageId: string,
            allowErrors: boolean = false
        ) {
            // Construct map
            for (const montage of montages) {
                const id = montage.id
                if (!(id in this.montageMap)) {
                    this.montageMap[id] = {}
                }
                const dir = montage.direction === null ? DEFAULT_MONTAGE_DIR : montage.direction
                this.montageMap[id][dir] = montage
            }
            // Make sure there is a default for each montage
            for (const id in this.montageMap) {
                const bucket = this.montageMap[id]
                if (!(DEFAULT_MONTAGE_DIR in bucket)) {
                    for (const dir in bucket) {
                        bucket[DEFAULT_MONTAGE_DIR] = bucket[dir]
                        break
                    }
                }
            }

            if (!this.hasMontage(defaultMontageId) && defaultMontageId !== "") {
                if (!allowErrors) {
                    throw new Error("Default montage \"" + defaultMontageId + "\" not found in collage")
                }
                // log.warn("Default montage " + defaultMontageId + " not found in collage")
            }
        }

        hasMontage(id: string): boolean {
            return id in this.montageMap
        }

        getMontage(id: string, direction?: direction_t | string): collage.Montage {
            if (!this.hasMontage(id)) {
                throw new Error("Montage \"" + id + "\" not found in collage")
            }
            const bucket = this.montageMap[id]
            if (direction === undefined) {
                return bucket[DEFAULT_MONTAGE_DIR]
            }
            const dirKey = splitTime.direction.interpret(direction)
            if (dirKey in bucket) {
                return bucket[dirKey]
            }
            const simplerDirKey = splitTime.direction.simplifyToCardinal(dirKey)
            if (simplerDirKey in bucket) {
                return bucket[simplerDirKey]
            }
            return bucket[DEFAULT_MONTAGE_DIR]
        }

        getDefaultMontage(direction?: direction_t | string): collage.Montage {
            return this.getMontage(this.defaultMontageId, direction)
        }
    }

    export namespace collage {
        export function makeCollageFromFile(file: file.Collage, allowErrors: boolean = false): Collage {
            const framesRectMap: { [id: string]: math.Rect } = {}
            for (const fileFrame of file.frames) {
                framesRectMap[fileFrame.id] =
                    math.Rect.make(fileFrame.x, fileFrame.y, fileFrame.width, fileFrame.height)
            }
            return new Collage(file.image, file.montages.map(fileMontage => {
                const dir = !fileMontage.direction ? null :
                    splitTime.direction.interpret(fileMontage.direction)
                return new collage.Montage(fileMontage.id,
                    dir,
                    fileMontage.frames.map(fpf => {
                        if (!(fpf.frameId in framesRectMap)) {
                            throw new Error("Could not find frame " + fpf.frameId +
                                " for montage " + fileMontage.id)
                        }
                        return new collage.Frame(
                            framesRectMap[fpf.frameId],
                            new Coordinates2D(fpf.offsetX, fpf.offsetY),
                            fpf.duration
                        )
                    }),
                    fileMontage.body,
                    fileMontage.traces,
                    fileMontage.propPostProcessor,
                    fileMontage.playerOcclusionFadeFactor
                )
            }), file.defaultMontageId, allowErrors)
        }
    }
}