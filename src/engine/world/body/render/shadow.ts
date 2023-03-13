import { DrawingBoard } from "engine/ui/viewport/drawing-board";
import { Rect } from "../../../math/rect";
import { Body } from "engine/world/body/body"
import { CanvasRequirements, Drawable } from "./drawable";
import { Coordinates3D } from "engine/world/level/level-location";
import { COLLISION_CALCULATOR } from "../collisions/collision-calculator";

export class Shadow implements Drawable {
    realBody: Body;
    shadowBody: Body;
    minRadius: number;
    maxRadius: number;
    radius: number;
    constructor(body: Body) {
        this.realBody = body;
        this.shadowBody = new Body();
        this.shadowBody.drawables.push(this);
        this.shadowBody.width = body.width;
        this.shadowBody.depth = body.depth;
        this.shadowBody.height = 0;
        this.minRadius = 4;
        this.maxRadius = Math.min(Math.max(this.shadowBody.width, this.shadowBody.depth), Math.min(this.shadowBody.width, this.shadowBody.depth) + 4);
        this.radius = this.maxRadius;
    }
    opacityModifier: number = 1;
    playerOcclusionFadeFactor = 0;
    getDesiredOrigin(whereDefaultWouldBe: Coordinates3D): Coordinates3D {
        return whereDefaultWouldBe;
    }
    getCanvasRequirements(): CanvasRequirements {
        return new CanvasRequirements(Rect.make(-this.radius / 2, -this.radius / 2, this.radius, this.radius));
    }
    draw(drawingBoard: DrawingBoard) {
        var // Radii of the white glow.
        innerRadius = 2, outerRadius = this.radius, 
        // Radius of the entire circle.
        radius = this.radius;
        var gradient = drawingBoard.raw.context.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius);
        gradient.addColorStop(0, "rgba(0, 0, 0, .7)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        drawingBoard.raw.context.scale(1, 0.5);
        drawingBoard.raw.context.beginPath();
        drawingBoard.raw.context.arc(0, 0, radius, 0, 2 * Math.PI);
        drawingBoard.raw.context.fillStyle = gradient;
        drawingBoard.raw.context.fill();
    }
    notifyTimeAdvance(delta: number) {
        // Do nothing
    }
    prepareForRender() {
        const maxFallDist = 1000;
        const maxMinBottom = this.realBody.z - maxFallDist;
        const minBottom = Math.max(maxMinBottom, this.realBody.level.lowestLayerZ);
        const scanDist = Math.max(this.realBody.z - minBottom, 0);
        const shadowFallInfo = COLLISION_CALCULATOR.calculateVolumeCollision(this.realBody.collisionMask, this.realBody.level, this.realBody.getLeft(), this.realBody.width, this.realBody.getTopY(), this.realBody.depth, minBottom, scanDist + 1, [this.realBody]);
        this.shadowBody.x = this.realBody.x;
        this.shadowBody.y = this.realBody.y;
        if (shadowFallInfo.blocked) {
            this.shadowBody.z = Math.min(shadowFallInfo.zBlockedTopEx, this.realBody.z);
        }
        else {
            this.shadowBody.z = minBottom;
        }
        this.radius =
            (this.maxRadius - this.minRadius) /
                (0.05 * Math.abs(this.realBody.z - this.shadowBody.z) + 1) +
                this.minRadius;
    }
    cleanupAfterRender() {
        // Do nothing
    }
    getLight(): null {
        return null;
    }
    clone(): Shadow {
        throw new Error("Shadows aren't meant to be cloned. Not implemented.");
    }
}
