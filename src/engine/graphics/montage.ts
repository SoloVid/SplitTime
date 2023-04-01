import { Frame } from "./frame";
import { BodySpec } from "../file/collage";
import { Trace } from "../world/level/level-file-data";
import { Rect, calculateTotalRectArea } from "../math/rect";
import { direction_t } from "engine/math/direction";
import { int } from "globals";
import { game_seconds } from "engine/time/timeline";
import { error } from "api/system";

type MakeMontageOptions = {
    readonly suppressErrors: boolean
}

export function makeMontage(
    id: string,
    direction: direction_t | null,
    frames: readonly Readonly<Frame>[],
    bodySpec: Readonly<BodySpec>,
    traces: readonly Readonly<Trace>[],
    propPostProcessorId: string,
    playerOcclusionFadeFactor: number,
    options: MakeMontageOptions = { suppressErrors: false }
) {
    return {
        id,
        direction,
        frames,
        bodySpec,
        traces,
        propPostProcessorId,
        playerOcclusionFadeFactor,

        getFrame(index: int): Frame {
            if (index < 0 || index >= this.frames.length || isNaN(index)) {
                if (!options.suppressErrors) {
                    error("Invalid frame index " + index);
                }
                return frameMissingPlaceholder
            }
            return this.frames[index];
        },

        getDuration(): game_seconds {
            return this.frames.reduce((sum, frame) => {
                return sum + frame.duration;
            }, 0);
        },

        getFrameAt(timeThrough: game_seconds): Frame {
            const timeWithin = timeThrough % this.getDuration();
            let countingThrough = 0;
            for (const frame of this.frames) {
                countingThrough += frame.duration;
                if (countingThrough > timeWithin) {
                    return frame;
                }
            }
            if (!options.suppressErrors) {
                error("Frame not found (impossible unless 0 frames?)");
            }
            return frameMissingPlaceholder
        },

        /**
         * The individual frames could be drawn all over the place.
         * This method returns a rectangle that contains room for all of them.
         * Returned box is relative to body positioned at (0, 0, 0).
         */
        getOverallArea(): Rect {
            return calculateTotalRectArea(this.frames.map(f => f.getTargetBox(this.bodySpec)));
        },
    }
}

/**
 * Animation of {@link Collage} {@link Frame}s with associated physics metadata
 */
export type Montage = Readonly<ReturnType<typeof makeMontage>>

const frameMissingPlaceholder = new Frame(
    Rect.make(0, 0, 32, 32),
    { x: 0, y: 0 },
    1.0,
)
