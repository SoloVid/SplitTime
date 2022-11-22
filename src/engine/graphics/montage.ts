import { Frame } from "./frame";
import { BodySpec } from "../file/collage";
import { Trace } from "../world/level/level-file-data";
import { Rect, calculateTotalRectArea } from "../math/rect";
import { direction_t } from "engine/math/direction";
import { int } from "globals";
import { game_seconds } from "engine/time/timeline";
/**
 * Animation of {@link Collage} {@link Frame}s with associated physics metadata
 */
export class Montage {
    constructor(readonly id: string, readonly direction: direction_t | null, readonly frames: readonly Readonly<Frame>[], readonly bodySpec: Readonly<BodySpec>, readonly traces: readonly Readonly<Trace>[], readonly propPostProcessorId: string, readonly playerOcclusionFadeFactor: number) { }
    getFrame(index: int): Frame {
        if (index < 0 || index >= this.frames.length) {
            throw new Error("Invalid frame index " + index);
        }
        return this.frames[index];
    }
    getDuration(): game_seconds {
        return this.frames.reduce((sum, frame) => {
            return sum + frame.duration;
        }, 0);
    }
    getFrameAt(timeThrough: game_seconds): Frame {
        const timeWithin = timeThrough % this.getDuration();
        let countingThrough = 0;
        for (const frame of this.frames) {
            countingThrough += frame.duration;
            if (countingThrough > timeWithin) {
                return frame;
            }
        }
        throw new Error("Frame not found (impossible unless 0 frames?)");
    }
    /**
     * The individual frames could be drawn all over the place.
     * This method returns a rectangle that contains room for all of them.
     * Returned box is relative to body positioned at (0, 0, 0).
     */
    getOverallArea(): Rect {
        return calculateTotalRectArea(this.frames.map(f => f.getTargetBox(this.bodySpec)));
    }
}
