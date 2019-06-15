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

    var simpleCollisionInfo = this.calculateXPixelCollision(x, y, z, dx);
    if(simpleCollisionInfo.blocked && simpleCollisionInfo.vStepUpEstimate <= SplitTime.Body.Mover.VERTICAL_FUDGE) {
        var stepUpZ = this.calculateRiseThroughTraces(x + dx, y, z, SplitTime.Body.Mover.VERTICAL_FUDGE).zEnd;
        var simpleStepUpCollisionInfo = this.calculateXPixelCollision(x, y, stepUpZ, dx);
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
 * @param {int} x
 * @param {int} y
 * @param {number} z
 * @param {int} dx should be -1 or 1
 * @returns {{blocked: boolean, bodies: SplitTime.Body[], vStepUpEstimate: number, events: string[]}}
 */
SplitTime.Body.Mover.prototype.calculateXPixelCollision = function(x, y, z, dx) {
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
    this.levelBodyOrganizer.forEachBody(edgeX, top, z, edgeX + 1, top + this.baseLength, z + this.height, handleFoundBody);

    if(!collisionInfo.blocked) {
        var traceCollision = this.calculateAreaTraceCollision(edgeX, 1, top, this.baseLength, z);
        collisionInfo.blocked = traceCollision.blocked;
        collisionInfo.events = traceCollision.events;
        collisionInfo.vStepUpEstimate = traceCollision.vStepUpEstimate;
    }
    return collisionInfo;
};
