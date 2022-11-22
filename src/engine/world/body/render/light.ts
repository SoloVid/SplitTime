import { GenericCanvasRenderingContext2D } from "engine/ui/viewport/canvas";

export interface Light {
    applyLighting(ctx: GenericCanvasRenderingContext2D, intensity: number): void;
}
