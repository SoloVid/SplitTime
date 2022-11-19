import { DrawingBoard, makeAssetDrawingBoard } from "engine/ui/viewport/drawing-board";
import { Color } from "../light/color";
import * as splitTime from "../splitTime";
import { Assets, Camera, Canvas, Coordinates2D, int, Level, LevelManager, Pledge, WeatherRenderer } from "../splitTime";
import { DRAW_TRACES, ENABLED } from "../utils/debug";
import { Renderer } from "./body/body-renderer";
import { Shadow } from "./body/render/shadow";

type BodyGetter = () => splitTime.Body | null;

type Options = {
    assets: Assets
    camera: Camera,
    see: DrawingBoard,
    levelManager: LevelManager,
    playerBodyGetter: BodyGetter,
}

export class WorldRenderer {
    private readonly assets: Assets
    private readonly camera: Camera
    private readonly see: DrawingBoard
    private readonly levelManager: LevelManager
    private readonly playerBodyGetter: BodyGetter

    private readonly SCREEN_WIDTH: int;
    private readonly SCREEN_HEIGHT: int;
    private readonly buffer: DrawingBoard;
    private readonly snapshot: DrawingBoard;
    private readonly bodyRenderer: Renderer;
    private readonly weatherRenderer: WeatherRenderer;
    private fadingOut: boolean = false;
    private fadeOutAmount: number = 0;
    private fadeInAmount: number = 0;
    private readonly FADE_INCREMENT: number = 0.05;
    private fadeToColor: Color = new Color(0, 0, 0);
    private fadeToTransparency: number = 1;
    private fadeOutPromise: Pledge = new Pledge();
    private fadeInPromise: Pledge = new Pledge();
    constructor(options: Options) {
        this.assets = options.assets
        this.camera = options.camera
        this.see = options.see
        this.levelManager = options.levelManager
        this.playerBodyGetter = options.playerBodyGetter

        this.SCREEN_WIDTH = this.camera.SCREEN_WIDTH;
        this.SCREEN_HEIGHT = this.camera.SCREEN_HEIGHT;
        this.buffer = makeAssetDrawingBoard(this.assets, this.SCREEN_WIDTH, this.SCREEN_HEIGHT)
        this.snapshot = makeAssetDrawingBoard(this.assets, this.SCREEN_WIDTH, this.SCREEN_HEIGHT)
        this.bodyRenderer = new Renderer(this.camera);
        this.weatherRenderer = new WeatherRenderer(this.camera);
    }
    renderBoardState(forceCalculate: boolean) {
        if (!forceCalculate) {
            this.see.raw.context.drawImage(this.snapshot.raw.element, 0, 0);
            return;
        }
        const currentLevel = this.levelManager.getCurrent();
        const screen = this.camera.getScreenCoordinates();
        this.bodyRenderer.notifyNewFrame(screen, this.snapshot);
        var bodies = currentLevel.getBodies();
        var playerBody = this.playerBodyGetter();
        for (var iBody = 0; iBody < bodies.length; iBody++) {
            var body = bodies[iBody];
            for (const drawable of body.drawables) {
                if (typeof drawable.prepareForRender === "function") {
                    drawable.prepareForRender();
                }
            }
            this.bodyRenderer.feedBody(body, body === playerBody);
            if (body.shadow) {
                var shadow = new Shadow(body);
                shadow.prepareForRender();
                this.bodyRenderer.feedBody(shadow.shadowBody, false);
            }
        }
        //Rendering sequence
        // buffer.context.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        this.snapshot.raw.context.clearRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        this.bodyRenderer.render();
        this.snapshot.raw.context.globalAlpha = 1;
        this.snapshot.raw.context.globalCompositeOperation = "destination-over";
        this.drawBackground(this.snapshot, screen, currentLevel);
        this.snapshot.raw.context.globalCompositeOperation = "source-over";
        if (ENABLED && DRAW_TRACES) {
            const backShift = this.getBackShift(screen);
            this.snapshot.raw.context.globalAlpha = 0.5;
            this.snapshot.raw.context.drawImage(currentLevel.getDebugTraceCanvas().element, screen.x + backShift.x, screen.y + backShift.y, this.SCREEN_WIDTH - 2 * backShift.x, this.SCREEN_HEIGHT - 2 * backShift.y, backShift.x, backShift.y, this.SCREEN_WIDTH - 2 * backShift.x, this.SCREEN_HEIGHT - 2 * backShift.y);
            this.snapshot.raw.context.globalAlpha = 1;
        }
        this.weatherRenderer.render(currentLevel, this.snapshot);
        // Note: this single call on a perform test is a huge percentage of CPU usage.
        // TODO: Why? Can we improve rendering performance?
        this.buffer.raw.context.drawImage(this.snapshot.raw.element, 0, 0);
        //If we need to fade the screen out
        if (this.fadingOut) {
            // We have this separate so that the final draw call finishes first
            if (this.fadeOutAmount >= this.fadeToTransparency) {
                this.fadingOut = false;
                this.fadeOutPromise.resolve();
            }
            this.fadeOutAmount += this.FADE_INCREMENT;
            if (this.fadeOutAmount >= this.fadeToTransparency) {
                this.fadeOutAmount = this.fadeToTransparency;
            }
        }
        else if (this.fadeInAmount > 0) { //If we need to fade back in
            this.fadeInAmount -= this.FADE_INCREMENT;
            //If we are now done fading in
            if (this.fadeInAmount <= 0) {
                this.fadeInAmount = 0;
                this.fadeInPromise.resolve();
            }
        }
        //Draw the (semi-)transparent rectangle for fading in/out
        this.buffer.raw.context.fillStyle = this.fadeToColor.cssString;
        this.buffer.raw.context.globalAlpha = this.fadeOutAmount + this.fadeInAmount;
        this.buffer.raw.context.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        //Save screen into snapshot
        this.see.raw.context.drawImage(this.buffer.raw.element, 0, 0);
        // reset global alpha
        this.buffer.raw.context.globalAlpha = 1;
        for (const body of bodies) {
            for (const drawable of body.drawables) {
                if (typeof drawable.cleanupAfterRender === "function") {
                    drawable.cleanupAfterRender();
                }
            }
            // TODO: maybe cleanup shadows?
        }
    }
    private getBackShift(screen: Coordinates2D): Coordinates2D {
        //Work out details of smaller-than-screen dimensions
        var xBackShift, yBackShift;
        if (screen.x < 0)
            xBackShift = -screen.x;
        else
            xBackShift = 0;
        if (screen.y < 0)
            yBackShift = -screen.y;
        else
            yBackShift = 0;
        return new Coordinates2D(xBackShift, yBackShift);
    }
    private drawBackground(drawingBoard: DrawingBoard, screen: Coordinates2D, currentLevel: Level): void {
        const backShift = this.getBackShift(screen);
        if (currentLevel.getBackgroundImage()) {
            drawingBoard.drawImage(
                currentLevel.getBackgroundImage(),
                {
                    x: backShift.x,
                    y: backShift.y,
                    width: this.SCREEN_WIDTH - 2 * backShift.x,
                    height: this.SCREEN_HEIGHT - 2 * backShift.y
                },
                {
                    x: screen.x + backShift.x - currentLevel.backgroundOffsetX,
                    y: screen.y + backShift.y - currentLevel.backgroundOffsetY,
                    width: this.SCREEN_WIDTH - 2 * backShift.x,
                    height: this.SCREEN_HEIGHT - 2 * backShift.y
                },
            );
        }
        // Fill in the rest of the background with black (mainly for the case of board being smaller than the screen)
        drawingBoard.withRawCanvasContext((ctx) => {
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        })
    }
    isAlreadyFaded(): boolean {
        return this.fadeOutAmount > 0;
    }
    /**
     * Fades the screen gradually to the target color (defaults to black if no parameters are passed)
     *
     * @param fadeToColor - the color that we want to fade to
     */
    fadeTo(color?: Color): PromiseLike<void> {
        if (color !== undefined) {
            this.fadeToColor.r = color.r;
            this.fadeToColor.g = color.g;
            this.fadeToColor.b = color.b;
            this.fadeToTransparency = color.a;
        }
        this.fadingOut = true;
        this.fadeOutPromise = new Pledge();
        return this.fadeOutPromise;
    }
    /**
     * Switch from fading out to fading in
     */
    fadeIn(): PromiseLike<void> {
        this.fadeInAmount = this.fadeToTransparency;
        this.fadeOutAmount = 0;
        this.fadeInPromise = new Pledge();
        if (this.fadeInAmount <= 0) {
            this.fadeInPromise.resolve();
        }
        return this.fadeInPromise;
    }
}
