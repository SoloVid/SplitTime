dependsOn("/body/Body.js");

SplitTime.Agent.Player = function(body) {
    this.body = body;
    this.movementAgent = new SplitTime.Agent.Movement(body);
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
