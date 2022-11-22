import { Light } from "./light";
import { Rect } from "../../../math/rect";
import { DrawingBoard } from "engine/ui/viewport/drawing-board";
import { TimeNotified } from "engine/time/timeline";
import { Coordinates3D } from "engine/world/level/level-location";

export interface Drawable extends TimeNotified {
    playerOcclusionFadeFactor: number;
    opacityModifier: number;
    /**
     * If the drawable wants the origin for the canvas (0, 0)
     * to be translated (e.g. to body coordinates),
     * it should return something here.
     * If the drawable prefers to use absolute coordinates,
     * it should return (0, 0, 0).
     * @param whereDefaultWouldBe suggestion on where to translate (e.g. the Body)
     */
    getDesiredOrigin(whereDefaultWouldBe: Coordinates3D): Coordinates3D;
    /**
     * Indicates what the drawable needs for a canvas.
     * The position of the rectangle will be assumed relative
     * to whatever the whereDefaultWouldBe parameter will be.
     */
    getCanvasRequirements(): CanvasRequirements;
    draw(drawingBoard: DrawingBoard): void;
    prepareForRender(): void;
    cleanupAfterRender(): void;
    getLight(): Light | null;
}
export class CanvasRequirements {
    readonly rect: Rect;
    readonly isCleared: boolean = false;
    constructor(rect: Rect) {
        this.rect = rect;
    }
}
