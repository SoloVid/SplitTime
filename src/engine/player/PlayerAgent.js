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
        var particles = new SplitTime.ParticleEmitter({x: activeBody.x, y: activeBody.y, z: activeBody.z}, function(emitter) {
            var p = new SplitTime.Particle(
                new SplitTime.Vector2D(SLVD.randomRanged(emitter.location.x - 16, emitter.location.x + 16), SLVD.randomRanged(emitter.location.y - 24, emitter.location.y + 24) - emitter.location.z - activeBody.height / 4),
                SplitTime.Vector2D.angular(SLVD.randomRanged(0, 2 * Math.PI), Math.random() * 16),
                new SplitTime.Vector2D(0, 10)
            );
            p.radius = 10;
            p.r = 80;
            p.g = 50;
            p.b = 120;
            return p;
        });
        particles.generateIntervalMs = 400;
        particles.maxParticleAgeMs = 1200;
        particles.stopEmissionsAfter = 3000;
        particles.colorShiftMagnitude = 5;
        particles.put(activeBody.getLevel());

        // activeBody.zVelocity = 560;
        var dir = activeBody.dir;
        activeBody.x += 96 * SplitTime.Direction.getXMagnitude(dir);
        activeBody.y += 96 * SplitTime.Direction.getYMagnitude(dir);
        // var particles = new WhateverTypeOfParticle(paramLikeTime, paramLikeColor);
        // showParticles(x, y, z, particles);

        var particles2 = new SplitTime.ParticleEmitter(activeBody, function(emitter) {
            var p = new SplitTime.Particle(
                new SplitTime.Vector2D(emitter.location.x, emitter.location.y - emitter.location.z - activeBody.height / 4),
                SplitTime.Vector2D.angular(SLVD.randomRanged(0, 2 * Math.PI), Math.random() * 32 + 16),
                new SplitTime.Vector2D(0, 10)
            );
            p.radius = 4;
            p.opacity = 0.5;
            // p.r = 255;
            // p.g = 200;
            // p.b = 0;
            return p;
        });
        particles2.generateIntervalMs = 10;
        particles2.maxParticleAgeMs = 800;
        particles2.stopEmissionsAfter = 800;
        // particles2.colorShiftMagnitude = 50;
        // particles2.colorShiftIntervalMs = 200;
        particles2.put(activeBody.getLevel());
    }
});