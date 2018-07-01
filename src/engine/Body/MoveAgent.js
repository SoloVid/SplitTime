dependsOn("Body.js");

SplitTime.Body.MoveAgent = function(body) {
    this.body = body;
    this.resetTarget();
};

SplitTime.Body.MoveAgent.prototype.setWalkingTowardBoardLocation = function(x, y) {
    this.targetBoardX = x;
    this.targetBoardY = y;
};
SplitTime.Body.MoveAgent.prototype.setWalkingTowardScreenLocation = function(x, y) {
    this.targetScreenX = x;
    this.targetScreenY = y;
};
SplitTime.Body.MoveAgent.prototype.setWalkingDirection = function(dir) {
    this.targetDirection = dir;
};
SplitTime.Body.MoveAgent.prototype.setStopped = function() {
    this.resetTarget();
};
SplitTime.Body.MoveAgent.prototype.update = function() {
    this.body.dir = this.getWalkingDirection();
    this.body.requestStance("walk");
    this.body.zeldaStep(this.body.spd);
};

SplitTime.Body.MoveAgent.prototype.resetTarget = function() {
    this.targetBoardX = null;
    this.targetBoardY = null;
    this.targetScreenX = null;
    this.targetScreenY = null;
    this.targetDirection = null;
};

SplitTime.Body.MoveAgent.prototype.getWalkingDirection = function() {
    if(this.targetDirection !== null) {
        return this.targetDirection;
    } else if(this.targetBoardX !== null && this.targetBoardY !== null) {
        // TODO: return some calculation
        return 0;
    } else if(this.targetScreenX !== null && this.targetScreenY !== null) {
        // TODO: some other calculation
        return 0;
    }
};
