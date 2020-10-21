namespace splitTime.collage {
    /**
     * Animation of {@link Collage} {@link Frame}s with associated physics metadata
     */
    export class Montage {
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

        getDuration(): game_seconds {
            return this.frames.reduce((sum, frame) => {
                return sum + frame.duration
            }, 0)
        }

        getFrameAt(timeThrough: game_seconds): Frame {
            const timeWithin = timeThrough % this.getDuration()
            let countingThrough = 0
            for (const frame of this.frames) {
                countingThrough += frame.duration
                if (countingThrough > timeWithin) {
                    return frame
                }
            }
            throw new Error("Frame not found (impossible unless 0 frames?)")
        }

        /**
         * The individual frames could be drawn all over the place.
         * This method returns a rectangle that contains room for all of them.
         * Returned box is relative to body positioned at (0, 0, 0).
         */
        getOverallArea(): math.Rect {
            let lowX = Number.POSITIVE_INFINITY
            let highX = Number.NEGATIVE_INFINITY
            let lowY = Number.POSITIVE_INFINITY
            let highY = Number.NEGATIVE_INFINITY
            for (const frame of this.frames) {
                const singleDrawArea = frame.getTargetBox(this.bodySpec)
                
                lowX = Math.min(lowX, singleDrawArea.x)
                highX = Math.max(highX, singleDrawArea.x2)
                lowY = Math.min(lowY, singleDrawArea.y)
                highY = Math.max(highY, singleDrawArea.y2)
            }
            return math.Rect.make(lowX, lowY, highX - lowX, highY - lowY)
        }
    }
}