namespace SplitTime {
    export class Vector2D {
        x: number;
        y: number;

        constructor(x, y) {
            this.x = x || 0;
            this.y = y || 0;        
        }

        static angular(angle, magnitude) {
            return new SplitTime.Vector2D(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
        }
    }
}
