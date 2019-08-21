dependsOn("../Body.js");

/**
 * @param {SplitTime.Vector2D} [posVec]
 * @param {SplitTime.Vector2D} [vVec]
 * @param {SplitTime.Vector2D} [accVec]
 * @constructor
 */
SplitTime.Particle = function(posVec, vVec, accVec) {
    this.age = 0; // milliseconds
    this.x = posVec ? posVec.x : 0;
    this.y = posVec ? posVec.y : 0;
    this.vx = vVec ? vVec.x : 0; // pixels per second
    this.vy = vVec ? vVec.y : 0; // pixels per second
    this.accX = accVec ? accVec.x : 0; // pixels per second per second
    this.accY = accVec ? accVec.y : 0; // pixels per second per second
    this.radius = 4;
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.colorShiftR = 0;
    this.colorShiftG = 0;
    this.colorShiftB = 0;
    this.opacity = 0.8;
    this.opacityShift = 0;
    // this.updateHandler = SplitTime.Particle.applyBasicPhysics;
    this.updateHandler = function(emitter, particle, msPassed) {
        SplitTime.Particle.applyBasicPhysics(emitter, particle, msPassed);
        SplitTime.Particle.applyLazyEffect(emitter, particle, msPassed);
        SplitTime.Particle.applyColorShift(emitter, particle, msPassed);
        SplitTime.Particle.applyOpacityShift(emitter, particle, msPassed);
    };
};

SplitTime.Particle.prototype.getFillStyle = function() {
    return "rgb(" + this.r + "," + this.g + "," + this.b + ")";
};

SplitTime.Particle.prototype.advanceTime = function(emitter, msPassed) {
    this.updateHandler(emitter, this, msPassed);
};

SplitTime.Particle.prototype.isOccasion = function(howOften, msPassed) {
    return Math.floor(this.age / howOften) !== Math.floor((this.age - msPassed / howOften));
};

SplitTime.Particle.applyBasicPhysics = function(emitter, particle, msPassed) {
    var seconds = msPassed / 1000;
    particle.x += particle.vx * seconds;
    particle.y += particle.vy * seconds;
    particle.vx += particle.accX * seconds;
    particle.vy += particle.accY * seconds;
    particle.age += msPassed;
};

SplitTime.Particle.applyLazyEffect = function(emitter, particle, msPassed) {
    var HOW_OFTEN = 2000;
    if(particle.isOccasion(HOW_OFTEN, msPassed)) {
        particle.accX = SLVD.randomRanged(-100, 100);
        particle.accY = SLVD.randomRanged(-100, 100);
    }
};

SplitTime.Particle.applyColorShift = function(emitter, particle, msPassed) {
    var HOW_OFTEN = 2000;
    var HOW_DRASTIC = 15;
    if(particle.isOccasion(HOW_OFTEN, msPassed)) {
        particle.colorShiftR = SLVD.randomRanged(-HOW_DRASTIC, HOW_DRASTIC);
        particle.colorShiftG = SLVD.randomRanged(-HOW_DRASTIC, HOW_DRASTIC);
        particle.colorShiftB = SLVD.randomRanged(-HOW_DRASTIC, HOW_DRASTIC);
    }
    particle.r = SLVD.constrain(particle.r + particle.colorShiftR, 0, 255);
    particle.g = SLVD.constrain(particle.g + particle.colorShiftG, 0, 255);
    particle.b = SLVD.constrain(particle.b + particle.colorShiftB, 0, 255);
};

SplitTime.Particle.applyOpacityShift = function(emitter, particle, msPassed) {
    var HOW_OFTEN = 2000;
    var HOW_DRASTIC = 0.1;
    if(particle.isOccasion(HOW_OFTEN, msPassed)) {
        particle.opacityShift = SLVD.randomRanged(-HOW_DRASTIC, HOW_DRASTIC);
    }
    particle.opacity = SLVD.constrain(particle.opacity + particle.opacityShift, 0, 1);
};

/**
 * @param {SplitTime.ParticleEmitter} emitter
 * @return {SplitTime.Particle}
 */
function generateDefaultParticle(emitter) {
    return new SplitTime.Particle(
        new SplitTime.Vector2D(emitter.location.x + Math.random() * 32 - 16, emitter.location.y - emitter.location.z + Math.random() * 32 - 16),
        SplitTime.Vector2D.angular(SLVD.randomRanged(0, 2 * Math.PI), Math.random() * 16),
        new SplitTime.Vector2D(0, 10)
    );
}

/**
 * @constructor
 * @implements {SplitTime.Body.Drawable}
 */
SplitTime.ParticleEmitter = function(location, particleGenerator) {
    this._particles = [];
    this._lastParticleGenerated = -1000;
    this._currentTime = 0;
    this.maxParticleAgeMs = 5000;
    this.stopEmissionsAfter = 0;
    this.generateIntervalMs = 100;
    this.location = location;
    this.generateParticle = particleGenerator || generateDefaultParticle;

    this._particlesGoneHandlers = new SLVD.RegisterCallbacks();

    this.xres = 100;
    this.yres = 100;
};

SplitTime.ParticleEmitter.prototype.playerOcclusionFadeFactor = 0.3;

SplitTime.ParticleEmitter.prototype.spawn = function(n) {
    n = n || 1;
    for(var i = 0; i < n; i++) {
        this._particles.push(this.generateParticle(this));
        this._lastParticleGenerated = this._currentTime;
    }
};

SplitTime.ParticleEmitter.prototype.advanceTime = function(msPassed) {
    var STEP = 40;
    for(var i = 0; i < msPassed; i += STEP) {
        this._advanceTimeStep(STEP);
    }
    this._advanceTimeStep(msPassed % STEP);
};

SplitTime.ParticleEmitter.prototype._advanceTimeStep = function(msPassed) {
    this._currentTime += msPassed;
    // var regenerateCount = 0;
    for(var iParticle = 0; iParticle < this._particles.length; iParticle++) {
        var particle = this._particles[iParticle];
        particle.advanceTime(this, msPassed);

        if(particle.age > this.maxParticleAgeMs) {
            this._particles.splice(iParticle, 1);
            iParticle--;
            // regenerateCount++;
        }
    }
    if(this.stopEmissionsAfter <= 0 || this._currentTime <= this.stopEmissionsAfter) {
        var timePassedSinceLastGeneration = this._currentTime - this._lastParticleGenerated;
        var randomFactor = (Math.random() / 2) + 0.75;
        var howManyToSpawn = Math.round(randomFactor * timePassedSinceLastGeneration / this.generateIntervalMs);
        if(howManyToSpawn > 0) {
            this.spawn(howManyToSpawn);
        }
    }
    // this.spawn(regenerateCount);

    if(this._particles.length === 0 && this._currentTime > this.stopEmissionsAfter) {
        this._particlesGoneHandlers.run();
    }
};

SplitTime.ParticleEmitter.prototype.getCanvasRequirements = function(x, y, z) {
    var canvReq = new SplitTime.Body.Drawable.CanvasRequirements(Math.round(x), Math.round(y), Math.round(z), this.xres, this.yres);
    canvReq.translateOrigin = false;
    return canvReq;
};

/**
 * @param {CanvasRenderingContext2D} ctx
 */
SplitTime.ParticleEmitter.prototype.draw = function(ctx) {
    var initialOpacity = ctx.globalAlpha;
    for(var iParticle = 0; iParticle < this._particles.length; iParticle++) {
        var particle = this._particles[iParticle];
        ctx.beginPath();
        ctx.fillStyle=particle.getFillStyle();
        ctx.globalAlpha = initialOpacity * particle.opacity;
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
    }
};

SplitTime.ParticleEmitter.prototype.notifyFrameUpdate = function(delta) {
    this.advanceTime(delta * 1000);
};

SplitTime.ParticleEmitter.prototype.prepareForRender = function() {
    // TODO maybe
};
SplitTime.ParticleEmitter.prototype.cleanupAfterRender = function() {
    // TODO maybe
};

SplitTime.ParticleEmitter.prototype.registerParticlesGoneHandler = function(handler) {
    this._particlesGoneHandlers.register(handler);
};