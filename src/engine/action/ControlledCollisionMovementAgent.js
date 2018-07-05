dependsOn("Agent.js");

SplitTime.Agent.ControlledCollisionMovement = function(body) {
    this.setBody(body);
};

SplitTime.Agent.ControlledCollisionMovement.prototype.setBody = function(body) {
    this.body = body;
    this.resetTarget();
};

SplitTime.Agent.ControlledCollisionMovement.prototype.setWalkingTowardBoardLocation = function(x, y) {
    this.targetBoardX = x;
    this.targetBoardY = y;
};
SplitTime.Agent.ControlledCollisionMovement.prototype.setWalkingTowardScreenLocation = function(x, y) {
    this.targetScreenX = x;
    this.targetScreenY = y;
};
SplitTime.Agent.ControlledCollisionMovement.prototype.setWalkingDirection = function(dir) {
    this.targetDirection = dir;
};
SplitTime.Agent.ControlledCollisionMovement.prototype.setStopped = function() {
    this.resetTarget();
};
SplitTime.Agent.ControlledCollisionMovement.prototype.notifyFrameUpdate = function() {
    var walkingDir = this.getWalkingDirection();
    if(walkingDir !== null) {
        this.body.dir = walkingDir;
        this.body.requestStance("walk");
        this.body.zeldaStep(this.body.spd);
    } else {
        this.body.defaultStance();
    }
};

SplitTime.Agent.ControlledCollisionMovement.prototype.resetTarget = function() {
    this.targetBoardX = null;
    this.targetBoardY = null;
    this.targetScreenX = null;
    this.targetScreenY = null;
    this.targetDirection = null;
};

SplitTime.Agent.ControlledCollisionMovement.prototype.getWalkingDirection = function() {
    if(this.targetDirection !== null) {
        return this.targetDirection;
    } else if(this.targetBoardX !== null && this.targetBoardY !== null) {
        // TODO: return some calculation
        return 0;
    } else if(this.targetScreenX !== null && this.targetScreenY !== null) {
        // TODO: some other calculation
        return 0;
    }
    return null;
};
