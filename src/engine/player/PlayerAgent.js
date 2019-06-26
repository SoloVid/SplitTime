dependsOn("/action/Agent.js");
dependsOn("Controls.js");

SplitTime.Agent.Player = function(body) {
    this.body = body;
    this.movementAgent = new SplitTime.Agent.ControlledCollisionMovement(body);
};

SplitTime.Agent.Player.prototype.setBody = function(body) {
    this.body = body;
    this.movementAgent.setBody(body);
};

SplitTime.Agent.Player.prototype.notifyFrameUpdate = function() {
    if(this.body !== SplitTime.Player.getActiveBody()) {
        this.movementAgent.setStopped();
        return;
    }

    var dir = SplitTime.Controls.JoyStick.getDirection();
    if(dir === null) {
        this.movementAgent.setStopped();
    } else {
        this.movementAgent.setWalkingDirection(dir);
    }
    this.movementAgent.notifyFrameUpdate();
};

SplitTime.Controls.Button.PRIMARY_INTERACT.onDown(function() {
    var activeBody = SplitTime.Player.getActiveBody();
    if(activeBody) {
        activeBody.zVelocity = 560;
    }
});

SplitTime.Controls.Button.PRIMARY_ACTION.onDown(function() {
    var activeBody = SplitTime.Player.getActiveBody();
    if(activeBody) {
        var dir = activeBody.dir;
        var warper = new SplitTime.Body.Warper(activeBody);
        warper.warp(dir, 96);
    }
});