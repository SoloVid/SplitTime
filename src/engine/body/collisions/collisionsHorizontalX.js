// NOTE: This file has a sister that is nearly identical: collisionsHorizontalY.js
// Currently, the implementations are separate for performance concerns, but merging is a consideration.

dependsOn("BodyMover.js");

/**
 * Check that dx can be accomplished, potentially with vertical adjustment.
 * @param {int} x
 * @param {int} y
 * @param {number} z
 * @param {int} dx should be -1 or 1
 * @returns {{blocked: boolean, bodies: SplitTime.Body[], adjustedZ: number, functions: string[]}}
 */
SplitTime.Body.Mover.prototype.calculateXPixelCollisionWithStepUp = function(x, y, z, dx) {
    var collisionInfo = {
        blocked: false,
        bodies: [],
        adjustedZ: z,
        functions: []
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
    collisionInfo.functions = simpleCollisionInfo.functions;

    return collisionInfo;
};

/**
 * Check that dx can be accomplished.
 * @param {int} x
 * @param {int} y
 * @param {number} z
 * @param {int} dx should be -1 or 1
 * @returns {{blocked: boolean, bodies: SplitTime.Body[], vStepUpEstimate: number, functions: string[]}}
 */
SplitTime.Body.Mover.prototype.calculateXPixelCollision = function(x, y, z, dx) {
    var collisionInfo = {
        blocked: false,
        bodies: [],
        vStepUpEstimate: 0,
        functions: []
    };
    var me = this;
    function handleFoundBody(otherBody) {
        if(isYOverlap(y, me.baseLength, otherBody.getY(), otherBody.baseLength) &&
            isZOverlap(z, me.height, otherBody.getZ(), otherBody.height)) {
            collisionInfo.blocked = true;
            collisionInfo.bodies.push(otherBody);
            collisionInfo.vStepUpEstimate = otherBody.getZ() + otherBody.height - z;
        }
    }
    var edgeX = dx > 0 ? x + dx + this.halfBaseLength : x + dx - this.halfBaseLength;
    if(dx > 0) {
        this.levelBodyOrganizer.forEachXLeft(edgeX, handleFoundBody);
    } else {
        this.levelBodyOrganizer.forEachXRight(edgeX, handleFoundBody);
    }

    if(!collisionInfo.blocked) {
        var top = y - this.halfBaseLength;
        var traceCollision = this.calculateAreaTraceCollision(edgeX, 1, top, this.baseLength, z);
        collisionInfo.blocked = traceCollision.blocked;
        collisionInfo.functions = traceCollision.functions;
    }
    return collisionInfo;
};

function isYOverlap(y1, baseLength1, y2, baseLength2) {
    var top1 = y1 - baseLength1 / 2;
    var top2 = y2 - baseLength2 / 2;
    var noOverlap = top1 + baseLength1 < top2 || top2 + baseLength2 < top1;
    return !noOverlap;
}

function isZOverlap(z1, height1, z2, height2) {
    var noOverlap = z1 + height1 <= z2 || z2 + height2 <= z1;
    return !noOverlap;
}
