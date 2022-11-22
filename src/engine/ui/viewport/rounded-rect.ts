import { GenericCanvasRenderingContext2D } from "./canvas";

export class RoundedRect {
    cornerRadius: number = 10;
    fill(ctx: GenericCanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
        this.doPath(ctx, x, y, width, height);
        ctx.fill();
    }
    stroke(ctx: GenericCanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
        this.doPath(ctx, x, y, width, height);
        ctx.stroke();
    }
    doPath(ctx: GenericCanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
        ctx.beginPath();
        ctx.moveTo(x + this.cornerRadius, y);
        ctx.lineTo(x + width - this.cornerRadius, y);
        ctx.arc(x + width - this.cornerRadius, y + this.cornerRadius, this.cornerRadius, 1.5 * Math.PI, 0, false);
        ctx.lineTo(x + width, y + height - this.cornerRadius);
        ctx.arc(x + width - this.cornerRadius, y + height - this.cornerRadius, this.cornerRadius, 0, 0.5 * Math.PI, false);
        ctx.lineTo(x + this.cornerRadius, y + height);
        ctx.arc(x + this.cornerRadius, y + height - this.cornerRadius, this.cornerRadius, 0.5 * Math.PI, Math.PI, false);
        ctx.lineTo(x, y + this.cornerRadius);
        ctx.arc(x + this.cornerRadius, y + this.cornerRadius, this.cornerRadius, Math.PI, 1.5 * Math.PI, false);
        ctx.closePath();
    }
}
