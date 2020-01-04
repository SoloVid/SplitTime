namespace SplitTime {
    export class Position implements LevelLocation {
        level: SplitTime.Level;
        x: number;
        y: number;
        z: number;
        dir;
        stance;
        constructor(level: Level, x: number, y: number, z: number, dir: number, stance: string) {
            this.level = level;
            this.x = x;
            this.y = y;
            this.z = z;
            this.dir = dir;
            this.stance = stance;
        };
        
        getLevel() {
            return this.level;
        };
        getX(): number {
            return this.x;
        }
        getY(): number {
            return this.y;
        }
        getZ(): number {
            return this.z;
        }
    }
}
