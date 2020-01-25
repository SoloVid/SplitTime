namespace SplitTime.body {
    export class Warper {
        level: SplitTime.Level;
        baseLength: number;
        halfBaseLength: number;
        height: number;
       constructor(public readonly body: SplitTime.Body) {
            this.level = body.getLevel();
            
            this.baseLength = this.body.baseLength;
            this.halfBaseLength = Math.round(this.baseLength / 2);
            this.height = this.body.height;
        };
        
        /**
        * Check that body is in current region
        */
        ensureInRegion() {
            // TODO: maybe reimplement?
            // if(this.body.getLevel().getRegion() !== SplitTime.Region.getCurrent()) {
            //     throw new Error("Attempt to do zelda movement for body not in current region");
            // }
        };
        
        /**
        * Advances SplitTime.Body up to maxDistance pixels as far as is legal.
        * Includes pushing other Bodys out of the way? (this part is currently unavailable)
        * @param {number} dir
        * @param {number} maxDistance
        * @returns {number} distance actually moved
        */
        warp(dir: number, maxDistance: number): number {
            this.ensureInRegion();
            
            var startX = Math.round(this.body.x);
            var startY = Math.round(this.body.y);
            var z = Math.round(this.body.z);
            var furthestX = Math.round(this.body.x + maxDistance * SplitTime.Direction.getXMagnitude(dir));
            var furthestY = Math.round(this.body.y + maxDistance * SplitTime.Direction.getYMagnitude(dir));
            
            var toX: number | null = null;
            var toY: number | null = null;
            var events: string[] = [];
            var otherLevelId: string | null = null;
            
            var me = this;
            SLVD.bresenham.forEachPoint(furthestX, furthestY, startX, startY, (x, y) => {
                if(x + me.halfBaseLength >= me.level.width || x - me.halfBaseLength < 0) {
                    return;
                }
                if(y + me.halfBaseLength >= me.level.yWidth || y - me.halfBaseLength < 0) {
                    return;
                }
                var collisionInfo = me._getCollisionInfoAt(x, y, z);
                if(!collisionInfo.blocked) {
                    if(toX === null) {
                        toX = x;
                        toY = y;
                        events = collisionInfo.events;
                        if(collisionInfo.otherLevels.length === 1) {
                            otherLevelId = collisionInfo.otherLevels[0];
                        }
                    }
                    return SLVD.bresenham.ReturnCode.EXIT_EARLY;
                }
                return;
            });
            
            if(toX !== null && toY !== null && (Math.abs(toX - startX) > this.baseLength || Math.abs(toY - startY) > this.baseLength)) {
                this.body.put(this.level, toX, toY, z);
                this.level.runEvents(events, this.body);
                if(otherLevelId !== null) {
                    var transporter = new SplitTime.body.Transporter(this.body);
                    transporter.transportLevelIfApplicable(otherLevelId);
                }
                return SplitTime.Measurement.distanceTrue(startX, startY, toX, toY);
            } else {
                return 0;
            }
        };
        
        private _getCollisionInfoAt(x: int, y: int, z: int): { blocked: boolean; events: string[]; otherLevels: string[]; } {
            var left = x - this.halfBaseLength;
            var top = y - this.halfBaseLength;
            
            return SplitTime.COLLISION_CALCULATOR.calculateVolumeCollision(this.level, left, this.baseLength, top, this.baseLength, z, this.body.height, this.body);
        };
    }
}
