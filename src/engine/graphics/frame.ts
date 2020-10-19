namespace splitTime.collage {
    /**
     * A single frame of animation as part of a {@link Parcel} of a {@link Collage}
     */
    export class Frame {
        constructor(
            /** Where inside the larger collage image this frame is */
            readonly box: Readonly<math.Rect>,
            /** How should this frame (image) be offset from the default position relative to body */
            readonly offset: Readonly<Coordinates2D>,
            /** How long should this frame play */
            readonly duration: game_seconds
        ) {}

        /**
         * Given the body dimensions (and body at (0, 0, 0)), where should the frame be drawn to?
         * Returned box is relative to squashed (0, 0, 0) coordinates of associated body.
         */
        getTargetBox(bodySpec: file.collage.BodySpec): math.Rect {
            const nonOffset = getDefaultTopLeft(bodySpec, this.box)
            return math.Rect.make(
                nonOffset.x + this.offset.x,
                nonOffset.y + this.offset.y,
                this.box.width,
                this.box.height
            )
        }
    }

    /**
     * By default, image sticks to front (y-axis) of body with bottom aligned.
     * This function abstracts that logic so it doesn't get duplicated everywhere.
     */
    export function getDefaultTopLeft(body: file.collage.BodySpec, frameBox: Readonly<math.Rect>): Coordinates2D {
        // Default is image stuck to front (y) of body with bottom aligned
        return {
            x: 0 - Math.floor(frameBox.width / 2),
            y: 0 + body.depth / 2 - frameBox.height
        }
    }

    // /**
    //  * Unlike {@link getDefaultTopLeft}, this function gets the top left given an actual position
    //  * rather than just relative to (0, 0, 0).
    //  */
    // export function getTopLeft(bodySpec: file.collage.BodySpec, coordinates: Coordinates3D, frameBox: Readonly<math.Rect>): Coordinates2D {
    //     const defaultTopLeft = getDefaultTopLeft(bodySpec, frameBox)
    //     return {
    //         x: coordinates.x + defaultTopLeft.x,
    //         y: coordinates.y - coordinates.z + defaultTopLeft.y
    //     }
    // }
}