// NOTE: This file has a sister that is nearly identical: collisionsHorizontalY.js
// Currently, the implementations are separate for performance concerns, but merging is a consideration.

dependsOn("BodyMover.js");

/**
 * Check that dx can be accomplished, potentially with vertical adjustment.
 * @param {int} x
 * @param {int} y
 * @param {number} z
 * @param {int} dx should be -1 or 1
 * @returns {{blocked: boolean, bodies: SplitTime.Body[], adjustedZ: number, events: string[], otherLevels: string[]}}
 */
SplitTime.Body.Mover.prototype.calculateXPixelCollisionWithStepUp = function(x, y, z, dx) {
    var collisionInfo = {
        blocked: false,
        bodies: [],
        adjustedZ: z,
        events: [],
        otherLevels: []
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
    collisionInfo.otherLevels = simpleCollisionInfo.otherLevels;

    return collisionInfo;
};

/**
 * Check that dx can be accomplished.
 * @param {SplitTime.Level} level
 * @param {int} x
 * @param {int} y
 * @param {number} z
 * @param {int} dx should be -1 or 1
 * @returns {{blocked: boolean, bodies: SplitTime.Body[], vStepUpEstimate: number, events: string[], otherLevels: string[]}}
 */
SplitTime.Body.Mover.prototype.calculateXPixelCollision = function(level, x, y, z, dx) {
    var edgeX = dx > 0 ? x + dx + this.halfBaseLength : x + dx - this.halfBaseLength;
    var top = y - this.halfBaseLength;
    return SplitTime.COLLISION_CALCULATOR.calculateVolumeCollision(level, edgeX, 1, top, this.baseLength, Math.round(z), Math.round(this.height));
};
