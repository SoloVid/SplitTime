// NOTE: This file has a sister that is nearly identical: collisionsHorizontalY.js
// Currently, the implementations are separate for performance concerns, but merging is a consideration.

dependsOn("BodyMover.js");

/**
 * Check that dx can be accomplished, potentially with vertical adjustment.
 * @param {int} x
 * @param {int} y
 * @param {number} z
 * @param {int} dx should be -1 or 1
 * @returns {{blocked: boolean, bodies: SplitTime.Body[], adjustedZ: number, events: string[]}}
 */
SplitTime.Body.Mover.prototype.calculateXPixelCollisionWithStepUp = function(x, y, z, dx) {
    var collisionInfo = {
        blocked: false,
        bodies: [],
        adjustedZ: z,
        events: []
    };

    var simpleCollisionInfo = this.calculateXPixelCollision(this.body.getLevel(), x, y, z, dx);
    if(simpleCollisionInfo.blocked && simpleCollisionInfo.vStepUpEstimate <= SplitTime.Body.Mover.VERTICAL_FUDGE) {
        var stepUpZ = this.calculateRiseThroughTraces(x + dx, y, z, SplitTime.Body.Mover.VERTICAL_FUDGE).zEnd;
        var simpleStepUpCollisionInfo = this.calculateXPixelCollision(this.body.getLevel(), x, y, stepUpZ, dx);
        if(!simpleStepUpCollisionInfo.blocked) {
            collisionInfo.adjustedZ = this.calculateDropThroughTraces(x + dx, y, stepUpZ, SplitTime.Body.Mover.VERTICAL_FUDGE).zBlocked;
            simpleCollisionInfo = simpleStepUpCollisionInfo;
        }
    }
    collisionInfo.blocked = simpleCollisionInfo.blocked;
    collisionInfo.bodies = simpleCollisionInfo.bodies;
    collisionInfo.events = simpleCollisionInfo.events;

    return collisionInfo;
};

/**
 * Check that dx can be accomplished.
 * @param {SplitTime.Level} level
 * @param {int} x
 * @param {int} y
 * @param {number} z
 * @param {int} dx should be -1 or 1
 * @returns {{blocked: boolean, bodies: SplitTime.Body[], vStepUpEstimate: number, events: string[]}}
 */
SplitTime.Body.Mover.prototype.calculateXPixelCollision = function(level, x, y, z, dx) {
    var collisionInfo = {
        blocked: false,
        bodies: [],
        vStepUpEstimate: 0,
        events: []
    };
    function handleFoundBody(otherBody) {
        collisionInfo.blocked = true;
        collisionInfo.bodies.push(otherBody);
        collisionInfo.vStepUpEstimate = otherBody.getZ() + otherBody.height - z;
    }
    var edgeX = dx > 0 ? x + dx + this.halfBaseLength : x + dx - this.halfBaseLength;
    var top = y - this.halfBaseLength;
    level.getCellGrid().forEachBody(edgeX, top, z, edgeX + 1, top + this.baseLength, z + this.height, handleFoundBody);

    if(!collisionInfo.blocked) {
        var traceCollision = this.calculateAreaTraceCollision(level, edgeX, 1, top, this.baseLength, z);
        collisionInfo.events = traceCollision.events;
        if(traceCollision.blocked) {
            collisionInfo.blocked = traceCollision.blocked;
            collisionInfo.vStepUpEstimate = traceCollision.vStepUpEstimate;
        } else {
            for(var iPointerCollision = 0; iPointerCollision < traceCollision.pointerTraces.length; iPointerCollision++) {
                var pointerTrace = traceCollision.pointerTraces[iPointerCollision];
                if(this.fromPointerLevels.indexOf(pointerTrace.level.id) < 0) {
                    this.fromPointerLevels.push(this.level.id);
                    try {
                        var otherLevelCollisionInfo = this.calculateXPixelCollision(
                            pointerTrace.level,
                            x + pointerTrace.offsetX,
                            y + pointerTrace.offsetY,
                            z + pointerTrace.offsetZ,
                            dx
                        );
                        // TODO: maybe add events?
                        if(otherLevelCollisionInfo.blocked) {
                            collisionInfo.blocked = true;
                            collisionInfo.bodies = otherLevelCollisionInfo.bodies;
                            collisionInfo.vStepUpEstimate = otherLevelCollisionInfo.vStepUpEstimate;
                            break;
                        }
                    } finally {
                        this.fromPointerLevels.pop();
                    }
                }
            }
        }
    }
    return collisionInfo;
};
