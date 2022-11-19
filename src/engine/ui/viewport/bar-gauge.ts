import { Renderer } from "./hud";
import { Color } from "../../light/color";
import { View } from "./view";
import { RoundedRect } from "./rounded-rect";
import { mod } from "../../splitTime";
export class BarGauge implements Renderer {
    x: number = 0;
    y: number = 0;
    width: number = 128;
    height: number = 20;
    outlineStyle = "rgba(0, 0, 0, .5)";
    outlineWidth = 2;
    constructor(private readonly fractionGetter: () => number, private readonly colorGetter: () => Color) {
    }
    render(view: View): void {
        const roundedRect = new RoundedRect();
        roundedRect.cornerRadius = Math.min(roundedRect.cornerRadius, this.width / 2, this.height / 2);
        const left = mod(this.x, view.width);
        const top = mod(this.y, view.height);
        view.see.withRawCanvasContext((ctx) => {
            roundedRect.doPath(ctx, left, top, this.width, this.height);
            ctx.strokeStyle = this.outlineStyle;
            ctx.lineWidth = this.outlineWidth;
            ctx.stroke();
            try {
                ctx.save();
                ctx.clip();
                ctx.fillStyle = this.colorGetter().cssString;
                ctx.fillRect(left, top, this.width * this.fractionGetter(), this.height);
            }
            finally {
                ctx.restore();
            }
        })
    }
}
