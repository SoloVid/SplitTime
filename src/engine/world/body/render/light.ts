import { GenericCanvasRenderingContext2D } from "../../../splitTime";
export interface Light {
    applyLighting(ctx: GenericCanvasRenderingContext2D, intensity: number): void;
}
