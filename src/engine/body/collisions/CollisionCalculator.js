var CollisionCalculator = function() {
    this._levelIdStack = [];
};

/**
 * Calculate collisions in volume. This function is primarily useful for gauging a slice of volume (i.e. one-pixel step).
 * @param {SplitTime.Level} level
 * @param {int} startX
 * @param {int} xPixels
 * @param {int} startY
 * @param {int} yPixels
 * @param {int} startZ
 * @param {int} zPixels
 * @returns {{blocked: boolean, bodies: SplitTime.Body[], vStepUpEstimate: number, events: string[], otherLevels: string[]}}
 */
CollisionCalculator.prototype.calculateVolumeCollision = function(level, startX, xPixels, startY, yPixels, startZ, zPixels) {
    var collisionInfo = {
        blocked: false,
        bodies: [],
        vStepUpEstimate: 0,
        events: [],
        otherLevels: []
    };
    function handleFoundBody(otherBody) {
        collisionInfo.blocked = true;
        collisionInfo.bodies.push(otherBody);
        collisionInfo.vStepUpEstimate = otherBody.getZ() + otherBody.height - startZ;
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
 * @param {SplitTime.Level} level
 * @param {int} startX
 * @param {int} xPixels
 * @param {int} startY
 * @param {int} yPixels
 * @param {int} startZ
 * @param {int} zPixels
 * @returns {{blocked: boolean, vStepUpEstimate: number, pointerTraces: SplitTime.Trace[], events: string[]}}
 */
CollisionCalculator.prototype.calculateVolumeTraceCollision = function(level, startX, xPixels, startY, yPixels, startZ, zPixels) {
    var collisionInfo = {
        blocked: false,
        vStepUpEstimate: 0,
        pointerTraces: [],
        events: []
    };

    var originCollisionInfo = new SplitTime.LevelTraces.CollisionInfo();
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

SplitTime.COLLISION_CALCULATOR = new CollisionCalculator();