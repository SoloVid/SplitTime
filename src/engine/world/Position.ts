namespace SplitTime {
    export class Position {
        level: SplitTime.Level;
        x: number;
        y: number;
        z: number;
        dir;
        stance;
        constructor(level, x, y, z, dir, stance) {
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
    }
}
