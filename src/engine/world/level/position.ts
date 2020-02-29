namespace splitTime {
    export class Position implements ILevelLocation {
        readonly level: splitTime.Level
        readonly x: number
        readonly y: number
        readonly z: number
        readonly dir: number
        readonly stance: string
        constructor(
            level: Level,
            x: number,
            y: number,
            z: number,
            dir: number,
            stance: string
        ) {
            this.level = level
            this.x = x
            this.y = y
            this.z = z
            this.dir = dir
            this.stance = stance
        }

        getLevel() {
            return this.level
        }
        getX(): number {
            return this.x
        }
        getY(): number {
            return this.y
        }
        getZ(): number {
            return this.z
        }
    }
}
