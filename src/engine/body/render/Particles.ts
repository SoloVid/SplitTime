namespace SplitTime.particles {
    /**
    * @param {SplitTime.Vector2D} [posVec]
    * @param {SplitTime.Vector2D} [vVec]
    * @param {SplitTime.Vector2D} [accVec]
    * @constructor
    */
    export class Particle {
        seed: number;
        age: number;
        x: any;
        y: any;
        vx: any;
        vy: any;
        accX: any;
        accY: any;
        radius: number;
        r: number;
        g: number;
        b: number;
        colorShiftR: number;
        colorShiftG: number;
        colorShiftB: number;
        opacity: number;
        opacityShift: number;
        constructor(posVec, vVec, accVec) {
            this.seed = Math.random();
            this.age = 0; // milliseconds
            this.x = posVec ? posVec.x : 0;
            this.y = posVec ? posVec.y : 0;
            this.vx = vVec ? vVec.x : 0; // pixels per second
            this.vy = vVec ? vVec.y : 0; // pixels per second
            this.accX = accVec ? accVec.x : 0; // pixels per second per second
            this.accY = accVec ? accVec.y : 0; // pixels per second per second
            this.radius = 4;
            this.r = 255;
            this.g = 255;
            this.b = 255;
            this.colorShiftR = 0;
            this.colorShiftG = 0;
            this.colorShiftB = 0;
            this.opacity = 0.8;
            this.opacityShift = 0;
            // this.updateHandler = SplitTime.Particle.applyBasicPhysics;
            // this.updateHandler = function(emitter, particle, msPassed) {
            //     SplitTime.Particle.applyBasicPhysics(emitter, particle, msPassed);
            //     SplitTime.Particle.applyLazyEffect(emitter, particle, msPassed);
            //     SplitTime.Particle.applyColorShift(emitter, particle, msPassed);
            //     SplitTime.Particle.applyOpacityShift(emitter, particle, msPassed);
            // };
        };
        
        getFillStyle() {
            return "rgb(" + this.r + "," + this.g + "," + this.b + ")";
        };
        
        advanceTime(emitter, msPassed) {
            SplitTime.particles.applyBasicPhysics(emitter, this, msPassed);
            SplitTime.particles.applyLazyEffect(emitter, this, msPassed);
            SplitTime.particles.applyColorShift(emitter, this, msPassed);
            SplitTime.particles.applyOpacityShift(emitter, this, msPassed);
            // this.updateHandler(emitter, this, msPassed);
        };
        
        isOccasion(howOften, msPassed) {
            var ageOffset = howOften * this.seed;
            return Math.floor((this.age + ageOffset) / howOften) !== Math.floor((this.age + ageOffset - msPassed / howOften));
        };
    }
    
    export function applyBasicPhysics(emitter, particle, msPassed) {
        var seconds = msPassed / 1000;
        particle.x += particle.vx * seconds;
        particle.y += particle.vy * seconds;
        particle.vx += particle.accX * seconds;
        particle.vy += particle.accY * seconds;
        particle.age += msPassed;
    };
    
    export function applyLazyEffect(emitter, particle, msPassed) {
        var HOW_OFTEN = emitter.lazyIntervalMs;
        var HOW_DRASTIC = emitter.lazyMagnitude;
        if(particle.isOccasion(HOW_OFTEN, msPassed)) {
            particle.accX = SLVD.randomRanged(-HOW_DRASTIC, HOW_DRASTIC);
            particle.accY = SLVD.randomRanged(-HOW_DRASTIC, HOW_DRASTIC);
        }
    };
    
    export function applyColorShift(emitter, particle, msPassed) {
        var HOW_OFTEN = emitter.colorShiftIntervalMs;
        var HOW_DRASTIC = emitter.colorShiftMagnitude;
        if(particle.isOccasion(HOW_OFTEN, msPassed)) {
            particle.colorShiftR = SLVD.randomRanged(-HOW_DRASTIC, HOW_DRASTIC);
            particle.colorShiftG = SLVD.randomRanged(-HOW_DRASTIC, HOW_DRASTIC);
            particle.colorShiftB = SLVD.randomRanged(-HOW_DRASTIC, HOW_DRASTIC);
        }
        particle.r = SLVD.constrain(particle.r + particle.colorShiftR, 0, 255);
        particle.g = SLVD.constrain(particle.g + particle.colorShiftG, 0, 255);
        particle.b = SLVD.constrain(particle.b + particle.colorShiftB, 0, 255);
    };
    
    export function applyOpacityShift(emitter, particle, msPassed) {
        var HOW_OFTEN = emitter.opacityShiftIntervalMs;
        var HOW_DRASTIC = emitter.opacityShiftMagnitude;
        if(particle.isOccasion(HOW_OFTEN, msPassed)) {
            particle.opacityShift = SLVD.randomRanged(-HOW_DRASTIC, HOW_DRASTIC);
        }
        particle.opacity = SLVD.constrain(particle.opacity + particle.opacityShift, 0, 1);
    };
    
    /**
    * @param {SplitTime.ParticleEmitter} emitter
    * @return {SplitTime.Particle}
    */
    export function generateDefaultParticle(emitter) {
        return new SplitTime.particles.Particle(
            new SplitTime.Vector2D(emitter.location.x + Math.random() * 32 - 16, emitter.location.y - emitter.location.z + Math.random() * 32 - 16),
            SplitTime.Vector2D.angular(SLVD.randomRanged(0, 2 * Math.PI), Math.random() * 16),
            new SplitTime.Vector2D(0, 10)
        );
    }
        
    export class ParticleEmitter implements SplitTime.body.Drawable {
        _particles: any[];
        _lastParticleGenerated: number;
        _currentTime: number;
        maxParticleAgeMs: number;
        stopEmissionsAfter: number;
        generateIntervalMs: number;
        location: any;
        generateParticle: any;
        _particlesGoneHandlers: SLVD.RegisterCallbacks;
        xres: number;
        yres: number;
        lazyIntervalMs: number;
        lazyMagnitude: number;
        opacityShiftIntervalMs: number;
        opacityShiftMagnitude: number;
        colorShiftIntervalMs: number;
        colorShiftMagnitude: number;
        constructor(location, particleGenerator) {
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
            
            this.lazyIntervalMs = 2000;
            this.lazyMagnitude = 0;
            
            this.opacityShiftIntervalMs = 2000;
            this.opacityShiftMagnitude = 0;
            
            this.colorShiftIntervalMs = 2000;
            this.colorShiftMagnitude = 0;
        };
        
        playerOcclusionFadeFactor = 0.3;
        
        spawn(n) {
            n = n || 1;
            for(var i = 0; i < n; i++) {
                this._particles.push(this.generateParticle(this));
                this._lastParticleGenerated = this._currentTime;
            }
        };
        
        advanceTime(msPassed) {
            var STEP = 40;
            for(var i = 0; i < msPassed; i += STEP) {
                this._advanceTimeStep(STEP);
            }
            this._advanceTimeStep(msPassed % STEP);
        };
        
        _advanceTimeStep(msPassed) {
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
        
        getCanvasRequirements(x, y, z) {
            var canvReq = new SplitTime.body.CanvasRequirements(Math.round(x), Math.round(y), Math.round(z), this.xres, this.yres);
            canvReq.translateOrigin = false;
            return canvReq;
        };
        
        /**
        * @param {CanvasRenderingContext2D} ctx
        */
        draw(ctx) {
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
        
        notifyFrameUpdate(delta) {
            // Do nothing
        }
        
        notifyTimeAdvance(delta) {
            this.advanceTime(delta * 1000);
        }
        
        prepareForRender() {
            // TODO maybe
        };
        cleanupAfterRender() {
            // TODO maybe
        };
        
        registerParticlesGoneHandler(handler) {
            this._particlesGoneHandlers.register(handler);
        };
        
        /**
        * @param {SplitTime.Level} level
        */
        put(level) {
            var tempBody = new SplitTime.Body();
            tempBody.baseLength = 0;
            tempBody.put(level, this.location.x, this.location.y, this.location.z);
            tempBody.drawable = this;
            this.registerParticlesGoneHandler(function() {
                tempBody.setLevel(null);
            });
        };
    }
}