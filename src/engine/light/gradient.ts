import { Color } from "./color";
import { mod } from "../splitTime";
class ColorStop {
    constructor(public offset: number, public color: Color) { }
}
export class Gradient {
    private colorStops: ColorStop[] = [];
    addColorStop(offset: number, color: Color): void {
        this.colorStops.push(new ColorStop(offset, color));
        this.colorStops.sort((a, b) => a.offset - b.offset);
    }
    getColorAt(offset: number): Color {
        let i = 0;
        while (i < this.colorStops.length && this.colorStops[i].offset <= offset) {
            i++;
        }
        const start = mod(i - 1, this.colorStops.length);
        const end = mod(i, this.colorStops.length);
        const stop1 = this.colorStops[start];
        const stop2 = this.colorStops[end];
        const dOffset = mod(stop2.offset - stop1.offset, 1);
        const relOffset = (offset % 1) - stop1.offset;
        const offsetFraction = relOffset / dOffset;
        const stop1Weight = 1 - offsetFraction;
        const stop2Weight = offsetFraction;
        return new Color(stop1.color.r * stop1Weight + stop2.color.r * stop2Weight, stop1.color.g * stop1Weight + stop2.color.g * stop2Weight, stop1.color.b * stop1Weight + stop2.color.b * stop2Weight);
    }
}
