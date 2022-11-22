import { randomInt } from "crypto";
import { Camera } from "engine/ui/viewport/camera";
import { Canvas, GenericCanvasRenderingContext2D } from "engine/ui/viewport/canvas";
import { DrawingBoard } from "engine/ui/viewport/drawing-board";
import { mod } from "engine/utils/misc";
import { int } from "globals";
import { getFromLevel } from "../time/time-helper";
import { Level } from "./level/level";

// TODO: Try not to let these be global state like this.
// export let RAIN_IMAGE: string = "rain.png";
// export let CLOUDS_IMAGE: string = "stormClouds.png";
const COUNTER_BASE = 25600;
export class WeatherRenderer {
    private readonly SCREEN_WIDTH: int;
    private readonly SCREEN_HEIGHT: int;
    private readonly buffer: Canvas;
    constructor(private readonly camera: Camera) {
        this.SCREEN_WIDTH = camera.SCREEN_WIDTH;
        this.SCREEN_HEIGHT = camera.SCREEN_HEIGHT;
        this.buffer = new Canvas(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
    }
    render(level: Level, drawingBoard: DrawingBoard) {
        const screen = this.camera.getScreenCoordinates();
        this.applyLighting(level, screen, drawingBoard);
        const counter = Math.round(getFromLevel(level) * 100) % COUNTER_BASE;
        //Weather
        if (level.weather.isRaining) {
            // ctx.drawImage(ASSETS.images.get(RAIN_IMAGE), -((counter % 100) / 100) * this.SCREEN_WIDTH, ((counter % 25) / 25) * this.SCREEN_HEIGHT -
            //     this.SCREEN_HEIGHT);
        }
        if (level.weather.isCloudy) {
            var CLOUDS_WIDTH = 2560;
            var CLOUDS_HEIGHT = 480;
            var xPixelsShift = -mod(counter - screen.x, CLOUDS_WIDTH);
            var yPixelsShift = mod(screen.y, CLOUDS_HEIGHT);
            drawingBoard.raw.context.globalAlpha = level.weather.cloudAlpha;
            // this.drawTiled(ASSETS.images.get(CLOUDS_IMAGE), ctx, xPixelsShift, yPixelsShift);
            drawingBoard.raw.context.globalAlpha = 1;
        }
        if (level.weather.lightningFrequency > 0) {
            // TODO: tie to time rather than frames
            const FPS = 60;
            if (randomInt(FPS * 60) <=
                level.weather.lightningFrequency) {
                drawingBoard.raw.context.fillStyle = "rgba(255, 255, 255, .75)";
                drawingBoard.raw.context.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
            }
        }
    }
    /**
     * @param {number} left x in image to start tiling at
     * @param {number} top y in image to start tiling at
     */
    private drawTiled(image: HTMLImageElement, ctx: GenericCanvasRenderingContext2D, left: number, top: number) {
        left = mod(left, image.naturalWidth);
        top = mod(top, image.naturalHeight);
        // Draw upper left tile
        ctx.drawImage(image, left, top, this.SCREEN_WIDTH, this.SCREEN_HEIGHT, 0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        var xEnd = image.naturalWidth - left;
        if (xEnd < this.SCREEN_WIDTH) {
            // Draw upper right tile if needed
            ctx.drawImage(image, 0, top, this.SCREEN_WIDTH, this.SCREEN_HEIGHT, xEnd, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        }
        var yEnd = image.naturalHeight - top;
        if (yEnd < this.SCREEN_HEIGHT) {
            // Draw lower left tile if needed
            ctx.drawImage(image, left, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT, 0, yEnd, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        }
        if (xEnd < this.SCREEN_WIDTH && yEnd < this.SCREEN_HEIGHT) {
            // Draw lower right tile if needed
            ctx.drawImage(image, 0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT, xEnd, yEnd, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        }
    }
    private applyLighting(level: Level, screen: {
        x: number;
        y: number;
    }, drawingBoard: DrawingBoard) {
        //Transparentize buffer
        this.buffer.context.clearRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        //Fill with light
        this.buffer.context.fillStyle = level.weather.getAmbientLight().cssString;
        this.buffer.context.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        this.buffer.context.globalCompositeOperation = "lighter";
        const bodies = level.getBodies();
        for (const body of bodies) {
            for (const drawable of body.drawables) {
                const light = drawable.getLight();
                if (!light) {
                    continue;
                }
                this.buffer.withCleanTransform(() => {
                    // FTODO: Don't duplicate with what's in BodyRenderer
                    const desiredOrigin = drawable.getDesiredOrigin(body);
                    this.buffer.context.translate(Math.round(desiredOrigin.x - screen.x), Math.round(desiredOrigin.y - desiredOrigin.z - screen.y));
                    light.applyLighting(this.buffer.context, drawable.opacityModifier);
                });
            }
        }
        // Return to default
        this.buffer.context.globalCompositeOperation = "source-over";
        drawingBoard.raw.context.globalCompositeOperation = "multiply";
        //Render buffer
        drawingBoard.raw.context.drawImage(this.buffer.element, 0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        //Return to default splitTime.image layering
        drawingBoard.raw.context.globalCompositeOperation = "source-over";
    }
}
