dependsOn("/action/Agent.js");
dependsOn("Controls.js");

/** @type SplitTime.Agent.Player[] */
var allPlayerAgents = [];

/**
 * @param {SplitTime.Body} body
 * @constructor
 */
SplitTime.Agent.Player = function(body) {
    this.body = body;
    this.movementAgent = new SplitTime.Agent.ControlledCollisionMovement(body);
    this._frozen = false;
    this._freezeUntil = 0;
    allPlayerAgents.push(this);
};

SplitTime.Agent.Player.prototype.notifyFrameUpdate = function(delta) {
    if(this.body !== SplitTime.Player.getActiveBody()) {
        this.movementAgent.setStopped();
        return;
    }

    var level = this.body.getLevel();
    if(level) {
        var timeMs = level.getRegion().getTimeMs();
        this._frozen = timeMs <= this._freezeUntil;
    }

    var dir = SplitTime.Controls.JoyStick.getDirection();
    if(dir === null) {
        this.movementAgent.setStopped();
    } else {
        this.movementAgent.setWalkingDirection(dir);
    }

    if(!this._frozen) {
        this.movementAgent.notifyFrameUpdate(delta);
    }
};

SplitTime.Agent.Player.prototype.applyJump = function() {
    if(!this._frozen) {
        this.body.zVelocity = 560;
        this._freezeUntil = this.body.getLevel().getRegion().getTimeMs() + 100;
    }
};

SplitTime.Agent.Player.prototype.applyWarp = function() {
    if(this._frozen) {
        return;
    }

    var body = this.body;

    var dir = this.body.dir;
    var warper = new SplitTime.Body.Warper(this.body);
    var distanceMoved = warper.warp(dir, 96);

    if(distanceMoved > 0) {
        // We calculate initialLocation after in the event that the body changed levels
        var dx = SplitTime.Direction.getXMagnitude(dir) * distanceMoved;
        var dy = SplitTime.Direction.getYMagnitude(dir) * distanceMoved;
        var initialLocation = {x: this.body.x - dx, y: this.body.y - dy, z: this.body.z};

        this._freezeUntil = this.body.getLevel().getRegion().getTimeMs() + 100;

        var GHOST_SPACING = 16;
        // var excessSpace = distanceMoved % GHOST_SPACING;
        // var workableSpace = distanceMoved - excessSpace;
        var numberOfGhosts = Math.floor(distanceMoved / GHOST_SPACING);
        var dxStep = dx / numberOfGhosts;
        var dyStep = dy / numberOfGhosts;

        for(var iGhost = 0; iGhost < numberOfGhosts; iGhost++) {
            var percent = iGhost / numberOfGhosts;
            var gX = initialLocation.x + iGhost * dxStep;
            var gY = initialLocation.y + iGhost * dyStep;
            var ABS_MAX_OPACITY = 0.7;
            var maxOpacity = ABS_MAX_OPACITY - 0.4 * (1 - percent);
            // Make sure some ghosts show up
            if(numberOfGhosts <= 2) {
                maxOpacity = ABS_MAX_OPACITY - 0.1 * (1 - percent);
            }
            var gSprite = this.drawGhost(gX, gY, this.body.z, maxOpacity);
            gSprite.opacity = (1 - percent) * maxOpacity * gSprite.opacity;
            gSprite.frame = gSprite.frame + iGhost % gSprite.getAnimationFramesAvailable();
        }

        // this.drawGhost((initialLocation.x + this.body.x)/2, (initialLocation.y + this.body.y)/2, this.body.z);

        var particles = new SplitTime.ParticleEmitter(initialLocation, function(emitter) {
            var p = new SplitTime.Particle(
                new SplitTime.Vector2D(SLVD.randomRanged(emitter.location.x - 16, emitter.location.x + 16), SLVD.randomRanged(emitter.location.y - 24, emitter.location.y + 24) - emitter.location.z - body.height / 4),
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
        particles.stopEmissionsAfter = 2000;
        particles.colorShiftMagnitude = 5;
        particles.put(this.body.getLevel());

        var particles2 = new SplitTime.ParticleEmitter(this.body, function(emitter) {
            var p = new SplitTime.Particle(
                new SplitTime.Vector2D(emitter.location.x, emitter.location.y - emitter.location.z - body.height / 4),
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
        particles2.stopEmissionsAfter = 500;
        // particles2.colorShiftMagnitude = 50;
        // particles2.colorShiftIntervalMs = 200;
        particles2.put(this.body.getLevel());
    }
};

/**
 * @param x
 * @param y
 * @param z
 * @param maxOpacity
 * @return {SplitTime.Sprite}
 */
SplitTime.Agent.Player.prototype.drawGhost = function(x, y, z, maxOpacity) {
    // var sprite = G.createTestWomanSprite();
    if(this.body.drawable instanceof SplitTime.Sprite) {
        var tempSprite = this.body.drawable.clone();
        var tempBody = new SplitTime.Body();
        tempBody.baseLength = 0;
        tempBody.put(this.body.getLevel(), x, y, z);
        tempBody.drawable = tempSprite;
        var hitMax = false;
        tempBody.registerFrameUpdateHandler(function(delta) {
            var dOpacity = 1.2 * delta;
            if(!hitMax) {
                tempSprite.opacity += dOpacity;
                if(tempSprite.opacity >= maxOpacity) {
                    tempSprite.opacity = maxOpacity;
                    hitMax = true;
                }
            } else {
                tempSprite.opacity -= dOpacity;
            }

            if(tempSprite.opacity <= 0) {
                SplitTime.Logger.debug("Removing ghost");
                tempBody.setLevel(null);
            }
        });
        return tempSprite;
    } else {
        if(SplitTime.Debug.ENABLED) {
            SplitTime.Logger.warn("Body doesn't have a Sprite object as drawable; so can't draw ghost");
        }
        return new SplitTime.Sprite("NA");
    }
};

SplitTime.Controls.Button.PRIMARY_INTERACT.onDown(function() {
    var activePlayerAgent = SplitTime.Player.getActivePlayerAgent();
    if(activePlayerAgent) {
        activePlayerAgent.applyJump();
    }
});

SplitTime.Controls.Button.PRIMARY_ACTION.onDown(function() {
    var activePlayerAgent = SplitTime.Player.getActivePlayerAgent();
    if(activePlayerAgent) {
        activePlayerAgent.applyWarp();
    }
});