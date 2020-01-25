
interface ILevelLocation {
    getX(): number;
    getY(): number;
    getZ(): number;
    getLevel(): SplitTime.Level;
}

namespace SplitTime.level {
    export class Location implements ILevelLocation {
        constructor(
            public readonly x: number,
            public readonly y: number,
            public readonly z: number,
            public readonly level: Level
        ) {

        }
        getX(): number {
            return this.x;
        }
        getY(): number {
            return this.y;
        }
        getZ(): number {
            return this.z;
        }
        getLevel(): Level {
            return this.level;
        }
    }
}
