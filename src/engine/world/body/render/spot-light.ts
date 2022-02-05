import { Light } from "./light";
import { Color } from "../../../light/color";
import { GenericCanvasRenderingContext2D } from "../../../splitTime";
export class SpotLight implements Light {
    constructor(public intensity: number = 0, public radius: number = 150) { }
    color: Color = new Color(255, 255, 255);
    applyLighting(ctx: GenericCanvasRenderingContext2D, intensityModifier: number): void {
        if (intensityModifier > 0 && this.intensity > 0) {
            var grd = ctx.createRadialGradient(0, 0, 1, 0, 0, this.radius);
            const combinedIntensity = intensityModifier * this.intensity;
            const colorInner = new Color(this.color.r, this.color.g, this.color.b, this.color.a * combinedIntensity);
            const colorOuter = new Color(this.color.r, this.color.g, this.color.b, 0);
            grd.addColorStop(0, colorInner.cssString);
            grd.addColorStop(1, colorOuter.cssString);
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
        }
    }
}
