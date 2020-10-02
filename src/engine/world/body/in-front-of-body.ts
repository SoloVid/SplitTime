namespace splitTime {
    export class InFrontOfBody implements ILevelLocation2 {
        constructor(
            private readonly body: Body,
            private readonly howFar: number,
            private readonly radiansOff: number = 0,
            private readonly offsetZ: number = 0
        ) {
        }
        get x() {
            return this.body.x + this.howFar * Math.cos(this.angleInRadians)
        }
        get y() {
            return this.body.y + this.howFar * (-Math.sin(this.angleInRadians))
        }
        get z() {
            return this.body.z + this.offsetZ
        }
        get level() {
            return this.body.level
        }

        private get angleInRadians(): number {
            return direction.toRadians(this.body.dir, false) + this.radiansOff
        }
    }
}
