dependsOn("../Body.js");

/**
 * @param {SplitTime.Vector2D} [vVec]
 * @param {SplitTime.Vector2D} [accVec]
 * @param {SplitTime.Vector2D} [posVec]
 * @constructor
 */
SplitTime.Particle = function(vVec, accVec, posVec) {
    this.age = 0; // milliseconds
    this.x = posVec ? posVec.x : 0;
    this.y = posVec ? posVec.y : 0;
    this.vx = vVec ? vVec.x : 0; // pixels per second
    this.vy = vVec ? vVec.y : 0; // pixels per second
    this.accX = accVec ? accVec.x : 0; // pixels per second per second
    this.accY = accVec ? accVec.y : 0; // pixels per second per second
};

SplitTime.Particle.prototype.advanceTime = function(msPassed) {
    var seconds = msPassed / 1000;
    this.x += this.vx * seconds;
    this.y += this.vy * seconds;
    this.vx += this.accX * seconds;
    this.vy += this.accY * seconds;
    this.age += msPassed;
};

function generateDefaultParticle() {
    return new SplitTime.Particle(SplitTime.Vector2D.angular(SLVD.randomRanged(0, 2 * Math.PI), Math.random() * 32));
}

/**
 * @constructor
 * @implements {SplitTime.Body.Drawable}
 */
SplitTime.ParticleEmitter = function(particleGenerator) {
    this._particles = [];
    this._lastParticleGenerated = -1000;
    this._currentTime = 0;
    this.particleRadius = 2;
    this.fillStyle = "#ffffff";
    this.maxParticleAgeMs = 5000;
    this.stopEmissionsAfter = 0;
    this.generateIntervalMs = 100;
    this.generateParticle = particleGenerator || generateDefaultParticle;

    this._particlesGoneHandlers = new SLVD.RegisterCallbacks();

    this.xres = 100;
    this.yres = 100;
};

SplitTime.ParticleEmitter.prototype.playerOcclusionFadeFactor = 0.3;

SplitTime.ParticleEmitter.prototype.spawn = function(n) {
    n = n || 1;
    for(var i = 0; i < n; i++) {
        this._particles.push(this.generateParticle());
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
        particle.advanceTime(msPassed);

        if(particle.age > this.maxParticleAgeMs) {
            this._particles.splice(iParticle, 1);
            iParticle--;
            // regenerateCount++;
        }
    }
    if(this.stopEmissionsAfter <= 0 || this._currentTime <= this.stopEmissionsAfter) {
        var timePassedSinceLastGeneration = this._currentTime - this._lastParticleGenerated;
        var randomFactor = (Math.random() / 2) + 0.75;
        this.spawn(randomFactor * timePassedSinceLastGeneration / this.generateIntervalMs);
    }
    // this.spawn(regenerateCount);

    if(this._particles.length === 0) {
        this._particlesGoneHandlers.run();
    }
};

/**
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @return {{x: int, y: int, z: int, width: number, height: number, isCleared: boolean}}
 */
SplitTime.ParticleEmitter.prototype.getCanvasRequirements = function(x, y, z) {
    return {
        // 2D board location for center of canvas
        x: Math.round(x),
        y: Math.round(y),
        z: Math.round(z),
        // TODO: smarter calculations
        width: this.xres,
        height: this.yres,
        isCleared: false
    };
};

/**
 * @param {CanvasRenderingContext2D} ctx
 */
SplitTime.ParticleEmitter.prototype.draw = function(ctx) {
    for(var iParticle = 0; iParticle < this._particles.length; iParticle++) {
        var particle = this._particles[iParticle];
        ctx.beginPath();
        ctx.fillStyle=this.fillStyle;
        ctx.arc(particle.x, particle.y, this.particleRadius, 0, Math.PI*2, true);
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