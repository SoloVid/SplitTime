import { assert } from "globals";
import { Collage } from "engine/graphics/collage";
import { game_seconds } from "engine/time/timeline";
import { GenericCanvasRenderingContext2D } from "engine/ui/viewport/canvas";
import { DrawingBoard } from "engine/ui/viewport/drawing-board";
import { Coordinates3D } from "engine/world/level/level-location";
import { int } from "globals";
import { BodySpec } from "../../../file/collage";
import { Frame } from "../../../graphics/frame";
import { Montage } from "../../../graphics/montage";
import { S } from "../../../math/direction";
import { CanvasRequirements, Drawable } from "./drawable";
import { Light } from "./light";

let nextRef = 10;
export class Sprite implements Drawable {
    private _time: game_seconds = 0;
    private _timeFrameStarted: game_seconds = 0;
    readonly ref: int;
    constructor(private readonly body: BodySpec, public readonly collage: Readonly<Collage>, public readonly defaultMontageId?: string) {
        this.ref = nextRef++;
    }
    static DEFAULT_STANCE = "__DEFAULT_STANCE__";
    private autoReset: boolean = true;
    omniDir = false;
    rotate = 0;
    opacityModifier = 1;
    playerOcclusionFadeFactor = 0;
    private stance: string | null = null;
    private requestedStance = Sprite.DEFAULT_STANCE;
    private requestedFrameReset = false;
    private frame = 0;
    private dir = S;
    private requestedDir = S;
    light: Light | null = null;
    // private get collage(): Readonly<Collage> {
    //     return ASSETS.collages.get(this.collageId);
    // }
    // private getImage(): HTMLImageElement {
    //     return ASSETS.images.get(this.collage.image);
    // }
    private getCurrentMontage(): Montage {
        if (this.stance === Sprite.DEFAULT_STANCE) {
            if (this.defaultMontageId) {
                return this.collage.getMontage(this.defaultMontageId, this.dir);
            }
            return this.collage.getDefaultMontage(this.dir);
        }
        assert(this.stance !== null, "Stance shouldn't be null at this point");
        return this.collage.getMontage(this.stance, this.dir);
    }
    private getCurrentFrame(): Frame {
        return this.getCurrentMontage().getFrame(this.frame);
    }
    getDesiredOrigin(whereDefaultWouldBe: Coordinates3D): Coordinates3D {
        return whereDefaultWouldBe;
    }
    getCanvasRequirements(): CanvasRequirements {
        return new CanvasRequirements(this.getCurrentFrame().getTargetBox(this.body));
    }
    draw(drawingBoard: DrawingBoard) {
        drawingBoard.withRawCanvasContext((ctx) => {
            ctx.rotate(this.rotate);
            this._drawSimple(drawingBoard, ctx);
            //ctx.rotate(-this.rotate);
            this.rotate = 0;
        })
    }
    private _drawSimple(drawingBoard: DrawingBoard, ctx: GenericCanvasRenderingContext2D) {
        const frame = this.getCurrentFrame();
        const targetBox = frame.getTargetBox(this.body);
        ctx.globalAlpha = ctx.globalAlpha * this.opacityModifier;
        drawingBoard.drawImage(this.collage.image, targetBox, frame.box);
    }
    requestStance(stance: string, dir: number, forceReset = false, hold: boolean = false) {
        this.requestedStance = stance;
        this.requestedDir = dir;
        this.requestedFrameReset = forceReset;
        this.autoReset = !hold;
    }
    private resetStance() {
        this.requestStance(Sprite.DEFAULT_STANCE, this.dir, true);
    }
    notifyTimeAdvance(delta: game_seconds) {
        this._time += delta;
    }
    prepareForRender() {
        const oldStance = this.stance;
        let currentFrameDuration: number = oldStance === null ? 0 : this.getCurrentFrame().duration;
        if (!this.requestedStance || !this.collage.hasMontage(this.requestedStance)) {
            this.requestedStance = Sprite.DEFAULT_STANCE;
        }
        this.stance = this.requestedStance;
        this.dir = this.requestedDir;
        const montage = this.getCurrentMontage();
        if (oldStance !== this.stance ||
            this.requestedFrameReset) {
            this.frame = 0;
            this._timeFrameStarted = this._time;
        }
        else {
            //Only update on frame tick
            while (this._time >= this._timeFrameStarted + currentFrameDuration) {
                this._timeFrameStarted = this._timeFrameStarted + currentFrameDuration;
                this.frame = montage.frames.length === 0 ? 0 : (this.frame + 1) % montage.frames.length;
                currentFrameDuration = this.getCurrentFrame().duration;
            }
        }
    }
    cleanupAfterRender() {
        if (this.autoReset) {
            this.resetStance();
        }
    }
    getLight(): Light | null {
        return this.light;
    }
    clone(): Sprite {
        const newBody = {
            width: this.body.width,
            depth: this.body.depth,
            height: this.body.height
        };
        var clone = new Sprite(newBody, this.collage);
        clone.omniDir = this.omniDir;
        clone.rotate = this.rotate;
        clone.opacityModifier = this.opacityModifier;
        clone.playerOcclusionFadeFactor = this.playerOcclusionFadeFactor;
        clone.stance = this.stance;
        clone.requestedStance = this.requestedStance;
        clone.requestedFrameReset = this.requestedFrameReset;
        clone.frame = this.frame;
        clone.dir = this.dir;
        clone.requestedDir = this.requestedDir;
        clone.light = this.light;
        return clone;
    }
}
