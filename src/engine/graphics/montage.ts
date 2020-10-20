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
            const drawArea = math.Rect.make(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, 0, 0)
            for (const frame of this.frames) {
                const singleDrawArea = frame.getTargetBox(this.bodySpec)
                drawArea.x = Math.min(drawArea.x, singleDrawArea.x)
                drawArea.x2 = Math.max(drawArea.x2, singleDrawArea.x2)
                drawArea.y = Math.min(drawArea.y, singleDrawArea.y)
                drawArea.y2 = Math.max(drawArea.y2, singleDrawArea.y2)
            }
            return drawArea
        }
    }
}