namespace splitTime.collage {
    /**
     * Animation of {@link Collage} {@link Frame}s with associated physics metadata
     */
    export class Parcel {
        constructor(
            readonly id: string,
            readonly direction: direction_t | null,
            readonly frames: readonly Readonly<Frame>[],
            readonly bodySpec: Readonly<file.collage.BodySpec>,
            readonly traces: readonly Readonly<level.file_data.Trace>[]
        ) {}

        getFrame(index: int): Frame {
            if (index < 0 || index >= this.frames.length) {
                throw new Error("Invalid frame index " + index)
            }
            return this.frames[index]
        }

        // getOverallArea(): Coordinates2D {
        // }
    }
}