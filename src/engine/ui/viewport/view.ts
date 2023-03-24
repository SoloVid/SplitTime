import { Assets } from "engine/assets/assets";
import { assert, int } from "globals";
import { ENABLED, attachDebug } from "../../utils/debug";
import { Canvas, GenericCanvasRenderingContext2D } from "./canvas";
import { DrawingBoard, makeAssetDrawingBoard } from "./drawing-board";
/**
 * This is the actual viewing window for the player to see the game.
 * Right now it is just a wrapper for a canvas, but it could
 * be changed a bit for other platforms.
 */
export class View {
    public readonly seeB: Canvas;
    public readonly seeC: GenericCanvasRenderingContext2D;
    public readonly see: DrawingBoard
    constructor(private readonly assets: Assets, public readonly width: int, public readonly height: int) {
        this.see = makeAssetDrawingBoard(assets, width, height)
        this.seeB = this.see.raw;
        if (this.seeB.element instanceof HTMLCanvasElement) {
            this.seeB.element.setAttribute("id", "game-window");
            this.seeB.element.setAttribute("style", `
                display: block;
                image-rendering:optimizeSpeed;             /* Legal fallback */
                image-rendering:-moz-crisp-edges;          /* Firefox        */
                image-rendering:-o-crisp-edges;            /* Opera          */
                image-rendering:-webkit-optimize-contrast; /* Safari         */
                image-rendering:optimize-contrast;         /* CSS3 Proposed  */
                image-rendering:crisp-edges;               /* CSS4 Proposed  */
                image-rendering:pixelated;                 /* CSS4 Proposed  */
                -ms-interpolation-mode:nearest-neighbor;   /* IE8+           */
            `);
        }
        this.seeC = this.seeB.context;
        this.see.raw.context.font = "20px Arial";
        this.see.raw.context.fillText("If this message persists for more than a few seconds,", 10, 30);
        this.see.raw.context.fillText("this game will not run on your browser.", 10, 60);
    }
    /**
     * Attach view to DOM
     * @param {string} parentId ID of HTML element within which the game canvas will be placed.
     *                       If unspecified, parent element will be document.body
     * @param {string} [additionalCanvasClass] CSS class string to apply to game canvas element (e.g. for stretching)
     */
    attach(parentId: string, options: AttachOptions = {}) {
        var parent = document.body;
        if (parentId) {
            const foundParent = document.getElementById(parentId);
            if (!foundParent) {
                throw new Error('Failed to find element "' +
                    parentId +
                    '" to attach game window');
            }
            parent = foundParent;
        }
        const el = this.seeB.element
        assert(el instanceof HTMLCanvasElement, "View#attach requires an HTML canvas");
        if (options.additionalCanvasClass) {
            el.setAttribute("class", options.additionalCanvasClass);
        }
        parent.appendChild(el);
        if (ENABLED) {
            attachDebug(parent);
        }
        if (options.stretchMode === "multiple" || !options.stretchMode) {
            const resizeObserver = new ResizeObserver((entries) => {
                const box = entries[0].contentBoxSize[0]
                // We factor in devicePixelRatio because we don't want the browser/device to automatically do any scaling for us.
                const width = box.inlineSize * window.devicePixelRatio
                const height = box.blockSize * window.devicePixelRatio
                const multipleUnrounded = Math.min(width / this.seeB.width, height / this.seeB.height)
                const multiple = multipleUnrounded <= 0 ? 1 : (multipleUnrounded < 1 ? multipleUnrounded : Math.floor(multipleUnrounded))
                el.style.width = `${this.seeB.width * multiple / window.devicePixelRatio}px`
                el.style.height = `${this.seeB.height * multiple / window.devicePixelRatio}px`
            })
            resizeObserver.observe(parent)
            window.addEventListener("keydown", (e) => {
                // If user explicitly tries to zoom in or out,
                // stop auto-resizing.
                if ((e.key === "=" || e.key === "-") && e.ctrlKey) {
                    resizeObserver.unobserve(parent)
                }
            })
        } else {
            el.style.width = "100%"
            el.style.height = "100%"
            el.style.objectFit = "contain"
        }
    }
}

export type AttachOptions = {
    additionalCanvasClass?: string
    stretchMode?: "multiple" | "contain"
}
