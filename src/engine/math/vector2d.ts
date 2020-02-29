namespace splitTime {
    export class Vector2D {
        x: number
        y: number

        constructor(x: number, y: number) {
            this.x = x || 0
            this.y = y || 0
        }

        static angular(angle: number, magnitude: number) {
            return new splitTime.Vector2D(
                magnitude * Math.cos(angle),
                magnitude * Math.sin(angle)
            )
        }
    }
}
