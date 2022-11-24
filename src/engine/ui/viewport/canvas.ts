import { assert } from "globals";
import { __NODE__, __WORKER__ } from "environment";
import { int } from "globals";

export type GenericCanvasRenderingContext2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
export class Canvas {
    public readonly element: HTMLCanvasElement | OffscreenCanvas
    public readonly context: GenericCanvasRenderingContext2D;
    public constructor(public readonly width: int, public readonly height: int) {
        assert(!__NODE__, "Canvas isn't available in Node.js");
        if (__WORKER__) {
            this.element = new OffscreenCanvas(width, height)
        } else {
            this.element = document.createElement("canvas");
            this.element.innerHTML =
                "Your browser does not support the canvas element this engine relies on. Please get a more modern browser to use this.";
            this.element.setAttribute("width", "" + width);
            this.element.setAttribute("height", "" + height);
        }
        const ctx = this.element.getContext("2d");
        if (!ctx) {
            throw new Error("Failed to allocate new canvas context");
        }
        this.context = ctx;
    }
    withCleanTransform(callback: () => void): void {
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        try {
            callback();
        }
        finally {
            this.context.setTransform(1, 0, 0, 1, 0, 0);
        }
    }
}
