import { Rect } from "../math/rect";
import { BodySpec } from "../file/collage";
import { Coordinates2D } from "engine/world/level/level-location";
import { game_seconds } from "engine/time/timeline";
/**
 * A single frame of animation as part of a {@link Montage} of a {@link Collage}
 */
export class Frame {
    constructor(
    /** Where inside the larger collage image this frame is */
    readonly box: Readonly<Rect>, 
    /** How should this frame (image) be offset from the default position relative to body */
    readonly offset: Readonly<Coordinates2D>, 
    /** How long should this frame play */
    readonly duration: game_seconds) { }
    /**
     * Given the body dimensions (and body at (0, 0, 0)), where should the frame be drawn to?
     * Returned box is relative to squashed (0, 0, 0) coordinates of associated body.
     */
    getTargetBox(bodySpec: BodySpec): Rect {
        const nonOffset = getDefaultTopLeft(bodySpec, this.box);
        return Rect.make(nonOffset.x + this.offset.x, nonOffset.y + this.offset.y, this.box.width, this.box.height);
    }
}
/**
 * By default, image sticks to front (y-axis) of body with bottom aligned.
 * This function abstracts that logic so it doesn't get duplicated everywhere.
 */
export function getDefaultTopLeft(body: BodySpec, frameBox: Readonly<Rect>): Coordinates2D {
    // Default is image stuck to front (y) of body with bottom aligned
    return {
        x: 0 - Math.floor(frameBox.width / 2),
        y: 0 + body.depth / 2 - frameBox.height
    };
}
