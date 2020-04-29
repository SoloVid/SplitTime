namespace splitTime {
    export class InFrontOfBody {
        constructor(
            private readonly body: Body,
            private readonly howFar: number
        ) {
        }
        get x() {
            return this.body.x + this.howFar * direction.getXMagnitude(this.body.dir)
        }
        get y() {
            return this.body.y + this.howFar * direction.getYMagnitude(this.body.dir)
        }
        get z() {
            return this.body.z
        }
        get level() {
            return this.body.level
        }
    }
}
