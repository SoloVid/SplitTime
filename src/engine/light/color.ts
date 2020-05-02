namespace splitTime.light {
    export class Color {
        constructor(
            public r: number,
            public g: number,
            public b: number
        ) {}

        toRgbaString(): string {
            return "rgba(" + this.r + ", " + this.g + ", " + this.b + ", 1)"
        }
    }
}