namespace SplitTime {
    class CollisionInfo {
        blocked: boolean = false;
        bodies: Body[] = [];
        vStepUpEstimate: int = 0;
        events: string[] = [];
        pointerTraces: Trace[] = [];
        otherLevels: string[] = [];
    }

    class CollisionCalculator {
        _levelIdStack: string[];
        constructor() {
            this._levelIdStack = [];
        };
        
        /**
        * Calculate collisions in volume. This function is primarily useful for gauging a slice of volume (i.e. one-pixel step).
        */
        calculateVolumeCollision(level: SplitTime.Level, startX: int, xPixels: int, startY: int, yPixels: int, startZ: int, zPixels: int, ignoreBody?: SplitTime.Body): CollisionInfo {
            var collisionInfo = new CollisionInfo();
            function handleFoundBody(otherBody: Body) {
                if(otherBody !== ignoreBody) {
                    collisionInfo.blocked = true;
                    collisionInfo.bodies.push(otherBody);
                    collisionInfo.vStepUpEstimate = otherBody.getZ() + otherBody.height - startZ;
                }
            }
            level.getCellGrid().forEachBody(startX, startY, startZ, startX + xPixels, startY + yPixels, startZ + zPixels, handleFoundBody);
            
            if(!collisionInfo.blocked) {
                var traceCollision = this.calculateVolumeTraceCollision(level, startX, xPixels, startY, yPixels, startZ, zPixels);
                collisionInfo.events = traceCollision.events;
                if(traceCollision.blocked) {
                    collisionInfo.blocked = traceCollision.blocked;
                    collisionInfo.vStepUpEstimate = traceCollision.vStepUpEstimate;
                } else {
                    for(var iPointerCollision = 0; iPointerCollision < traceCollision.pointerTraces.length; iPointerCollision++) {
                        var pointerTrace = traceCollision.pointerTraces[iPointerCollision];
                        if(!pointerTrace.level) {
                            throw new Error("Pointer trace does not have level");
                        }
                        collisionInfo.otherLevels.push(pointerTrace.level.id);
                        if(this._levelIdStack.indexOf(pointerTrace.level.id) < 0) {
                            this._levelIdStack.push(level.id);
                            try {
                                var otherLevelCollisionInfo = this.calculateVolumeCollision(
                                    pointerTrace.level,
                                    startX + pointerTrace.offsetX,
                                    xPixels,
                                    startY + pointerTrace.offsetY,
                                    yPixels,
                                    startZ + pointerTrace.offsetZ,
                                    zPixels
                                );
                                // TODO: maybe add events?
                                if(otherLevelCollisionInfo.blocked) {
                                    collisionInfo.blocked = true;
                                    collisionInfo.bodies = otherLevelCollisionInfo.bodies;
                                    collisionInfo.vStepUpEstimate = otherLevelCollisionInfo.vStepUpEstimate;
                                    break;
                                }
                            } finally {
                                this._levelIdStack.pop();
                            }
                        }
                    }
                }
            }
            return collisionInfo;
        };
        
        /**
        * Check that the volume is open in level collision canvas data.
        */
        calculateVolumeTraceCollision(level: SplitTime.Level, startX: int, xPixels: int, startY: int, yPixels: int, startZ: int, zPixels: int): CollisionInfo {
            var collisionInfo = new CollisionInfo();
            
            var originCollisionInfo = new SplitTime.level.traces.CollisionInfo();
            level.getLevelTraces().calculateVolumeCollision(originCollisionInfo, startX, xPixels, startY, yPixels, startZ, startZ + zPixels);
            
            collisionInfo.vStepUpEstimate = originCollisionInfo.zBlockedTopEx - startZ;
            collisionInfo.blocked = originCollisionInfo.containsSolid && collisionInfo.vStepUpEstimate > 0;
            for(var levelId in originCollisionInfo.pointerTraces) {
                collisionInfo.pointerTraces.push(originCollisionInfo.pointerTraces[levelId]);
            }
            for(var eventId in originCollisionInfo.events) {
                collisionInfo.events.push(eventId);
            }
            
            return collisionInfo;
        };
    }
    
    export const COLLISION_CALCULATOR = new CollisionCalculator();
}