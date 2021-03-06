namespace splitTime.file {
    /**
     * Serializable form of {@link splitTime.Collage}, specifically used in JSON file format.
     */
    export interface Collage {
        image: string
        frames: collage.Frame[]
        montages: collage.Montage[]
        /** Reference to a {@link collage.Montage} in {@link Collage#montages} */
        defaultMontageId: string
    }

    // Expect compiler error here if Collage is not jsonable
    let testCollageJsonable: IsJsonable<Collage, false> = {} as Collage

    export namespace collage {
        /**
         * Component of {@link Collage}, specifically used in JSON file format.
         * Specific rectangle within the collage image.
         * 
         * Unlike {@link splitTime.collage.Frame}, a single Frame may be used by multiple {@link Montage}s.
         */
        export interface Frame {
            id: string
            x: int
            y: int
            width: int
            height: int
        }

        /**
         * Component of {@link Collage}, specifically used in JSON file format.
         * Sequence of {@link Frame}s, with associated geometry.
         */
        export interface Montage {
            id: string
            direction: string
            frames: MontageFrame[]
            body: BodySpec
            traces: level.file_data.Trace[]
            /**
             * Identifier for a post-processor that will have a chance
             * to touch any props created from this montage.
             */
            propPostProcessor: string
            /**
             * Value in [0,1] how much to fade when occluding player.
             */
            playerOcclusionFadeFactor: number
        }

        /**
         * Component of {@link Montage}, specifically used in JSON file format.
         * 
         * This type is more similar to {@link splitTime.collage.Frame} than {@link Frame} is.
         */
        export interface MontageFrame {
            /** Reference to a {@link Frame} object within this {@link Collage#frames} */
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
                montages: type.array(type.object({
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
                    propPostProcessor: type.string,
                    playerOcclusionFadeFactor: type.number
                })),
                defaultMontageId: type.string
            }))
        }
    }
}