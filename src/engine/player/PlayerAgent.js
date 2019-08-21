dependsOn("/action/Agent.js");
dependsOn("Controls.js");

SplitTime.Agent.Player = function(body) {
    this.body = body;
    this.movementAgent = new SplitTime.Agent.ControlledCollisionMovement(body);
};

SplitTime.Agent.Player.prototype.notifyFrameUpdate = function(delta) {
    if(this.body !== SplitTime.Player.getActiveBody()) {
        this.movementAgent.setStopped();
        return;
    }

    // if(this.body.drawable) {
    //     this.body.drawable.advanceTime(100);
    // }

    var dir = SplitTime.Controls.JoyStick.getDirection();
    if(dir === null) {
        this.movementAgent.setStopped();
    } else {
        this.movementAgent.setWalkingDirection(dir);
    }
    this.movementAgent.notifyFrameUpdate(delta);
};

SplitTime.Controls.Button.PRIMARY_INTERACT.onDown(function() {
    var activeBody = SplitTime.Player.getActiveBody();
    if(activeBody) {
        // activeBody.zVelocity = 560;
        var dir = activeBody.dir;
        activeBody.x += 64 * SplitTime.Direction.getXMagnitude(dir);
        activeBody.y += 64 * SplitTime.Direction.getYMagnitude(dir);
        // var particles = new WhateverTypeOfParticle(paramLikeTime, paramLikeColor);
        // showParticles(x, y, z, particles);
    }
});