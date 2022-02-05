export class BellCurve {
    constructor(private readonly standardDeviation: number = 0.5, private readonly offsetX: number = 0) { }
    calculate(x: number): number {
        return (1 / (this.standardDeviation * Math.sqrt(2 * Math.PI))) *
            Math.exp(-1 / 2 * Math.pow((x - this.offsetX) / this.standardDeviation, 2));
    }
}
