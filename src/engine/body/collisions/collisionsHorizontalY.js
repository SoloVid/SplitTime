// NOTE: This file has a sister that is nearly identical: collisionsHorizontalX.js
// Currently, the implementations are separate for performance concerns, but merging is a consideration.

dependsOn("BodyMover.js");

/**
 * Check that dy can be accomplished, potentially with vertical adjustment.
 * @param {int} x
 * @param {int} y
 * @param {number} z
 * @param {int} dy should be -1 or 1
 * @returns {{blocked: boolean, bodies: SplitTime.Body[], adjustedZ: number, events: string[], otherLevels: string[]}}
 */
SplitTime.Body.Mover.prototype.calculateYPixelCollisionWithStepUp = function(x, y, z, dy) {
    var collisionInfo = {
        blocked: false,
        bodies: [],
        adjustedZ: z,
        events: [],
        otherLevels: []
    };

    var simpleCollisionInfo = this.calculateYPixelCollision(this.body.getLevel(), x, y, z, dy);
    if(simpleCollisionInfo.blocked && simpleCollisionInfo.vStepUpEstimate <= SplitTime.Body.Mover.VERTICAL_FUDGE) {
        var stepUpZ = this.calculateRiseThroughTraces(x, y + dy, z, SplitTime.Body.Mover.VERTICAL_FUDGE).zEnd;
        var simpleStepUpCollisionInfo = this.calculateYPixelCollision(this.body.getLevel(), x, y, stepUpZ, dy);
        if(!simpleStepUpCollisionInfo.blocked) {
            collisionInfo.adjustedZ = this.calculateDropThroughTraces(x, y + dy, stepUpZ, SplitTime.Body.Mover.VERTICAL_FUDGE).zBlocked;
            simpleCollisionInfo = simpleStepUpCollisionInfo;
        }
    }
    collisionInfo.blocked = simpleCollisionInfo.blocked;
    collisionInfo.bodies = simpleCollisionInfo.bodies;
    collisionInfo.events = simpleCollisionInfo.events;
    collisionInfo.otherLevels = simpleCollisionInfo.otherLevels;

    return collisionInfo;
};

/**
 * Check that dy can be accomplished.
 * @param {SplitTime.Level} level
 * @param {int} x
 * @param {int} y
 * @param {number} z
 * @param {int} dy should be -1 or 1
 * @returns {{blocked: boolean, bodies: SplitTime.Body[], vStepUpEstimate: number, events: string[]}}
 */
SplitTime.Body.Mover.prototype.calculateYPixelCollision = function(level, x, y, z, dy) {
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
        collisionInfo.vStepUpEstimate = otherBody.getZ() + otherBody.height - z;
    }
    var edgeY = dy > 0 ? y + dy + this.halfBaseLength : y + dy - this.halfBaseLength;
    var left = x - this.halfBaseLength;
    level.getCellGrid().forEachBody(left, edgeY, z, left + this.baseLength, edgeY + 1, z + this.height, handleFoundBody);

    if(!collisionInfo.blocked) {
        var traceCollision = this.calculateAreaTraceCollision(level, left, this.baseLength, edgeY, 1, z);
        collisionInfo.events = traceCollision.events;
        if(traceCollision.blocked) {
            collisionInfo.blocked = traceCollision.blocked;
            collisionInfo.vStepUpEstimate = traceCollision.vStepUpEstimate;
        } else {
            for(var iPointerCollision = 0; iPointerCollision < traceCollision.pointerTraces.length; iPointerCollision++) {
                var pointerTrace = traceCollision.pointerTraces[iPointerCollision];
                collisionInfo.otherLevels.push(pointerTrace.level.id);
                if(this._levelIdStack.indexOf(pointerTrace.level.id) < 0) {
                    this._levelIdStack.push(this.level.id);
                    try {
                        var otherLevelCollisionInfo = this.calculateYPixelCollision(
                            pointerTrace.level,
                            x + pointerTrace.offsetX,
                            y + pointerTrace.offsetY,
                            z + pointerTrace.offsetZ,
                            dy
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
