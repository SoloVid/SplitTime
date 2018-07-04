dependsOn("/body/Body.js");

SplitTime.Agent.Player = function(body) {
    this.body = body;
    this.movementAgent = new SplitTime.Agent.Movement(body);
};

SplitTime.Agent.Player.prototype.notifyFrameUpdate = function() {
    var dir = SplitTime.Controls.JoyStick.getDirection();
    if(dir === null) {
        this.movementAgent.setStopped();
    } else {
        this.movementAgent.setWalkingDirection(dir);
    }
    this.movementAgent.notifyFrameUpdate();
};
