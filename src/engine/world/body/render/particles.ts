namespace splitTime.particles {
    export class Particle {
        seed: number
        age: number
        x: number
        y: number
        vx: number
        vy: number
        accX: number
        accY: number
        radius: number
        r: number
        g: number
        b: number
        colorShiftR: number
        colorShiftG: number
        colorShiftB: number
        opacity: number
        opacityShift: number

        constructor(
            posVec: splitTime.Vector2D,
            vVec: splitTime.Vector2D,
            accVec: splitTime.Vector2D
        ) {
            this.seed = Math.random()
            this.age = 0 // milliseconds
            this.x = posVec ? posVec.x : 0
            this.y = posVec ? posVec.y : 0
            this.vx = vVec ? vVec.x : 0 // pixels per second
            this.vy = vVec ? vVec.y : 0 // pixels per second
            this.accX = accVec ? accVec.x : 0 // pixels per second per second
            this.accY = accVec ? accVec.y : 0 // pixels per second per second
            this.radius = 4
            this.r = 255
            this.g = 255
            this.b = 255
            this.colorShiftR = 0
            this.colorShiftG = 0
            this.colorShiftB = 0
            this.opacity = 0.8
            this.opacityShift = 0
            // this.updateHandler = splitTime.Particle.applyBasicPhysics;
            // this.updateHandler = function(emitter, particle, msPassed) {
            //     splitTime.Particle.applyBasicPhysics(emitter, particle, msPassed);
            //     splitTime.Particle.applyLazyEffect(emitter, particle, msPassed);
            //     splitTime.Particle.applyColorShift(emitter, particle, msPassed);
            //     splitTime.Particle.applyOpacityShift(emitter, particle, msPassed);
            // };
        }

        getFillStyle(): string {
            return "rgb(" + this.r + "," + this.g + "," + this.b + ")"
        }

        advanceTime(emitter: ParticleEmitter, msPassed: number): void {
            splitTime.particles.applyBasicPhysics(emitter, this, msPassed)
            splitTime.particles.applyLazyEffect(emitter, this, msPassed)
            splitTime.particles.applyColorShift(emitter, this, msPassed)
            splitTime.particles.applyOpacityShift(emitter, this, msPassed)
            // this.updateHandler(emitter, this, msPassed);
        }

        isOccasion(howOften: number, msPassed: number): boolean {
            var ageOffset = howOften * this.seed
            return (
                Math.floor((this.age + ageOffset) / howOften) !==
                Math.floor(this.age + ageOffset - msPassed / howOften)
            )
        }
    }

    export function applyBasicPhysics(
        emitter: ParticleEmitter,
        particle: Particle,
        msPassed: number
    ): void {
        var seconds = msPassed / 1000
        particle.x += particle.vx * seconds
        particle.y += particle.vy * seconds
        particle.vx += particle.accX * seconds
        particle.vy += particle.accY * seconds
        particle.age += msPassed
    }

    export function applyLazyEffect(
        emitter: ParticleEmitter,
        particle: Particle,
        msPassed: number
    ): void {
        var HOW_OFTEN = emitter.lazyIntervalMs
        var HOW_DRASTIC = emitter.lazyMagnitude
        if (particle.isOccasion(HOW_OFTEN, msPassed)) {
            particle.accX = splitTime.randomRanged(-HOW_DRASTIC, HOW_DRASTIC)
            particle.accY = splitTime.randomRanged(-HOW_DRASTIC, HOW_DRASTIC)
        }
    }

    export function applyColorShift(
        emitter: ParticleEmitter,
        particle: Particle,
        msPassed: number
    ): void {
        var HOW_OFTEN = emitter.colorShiftIntervalMs
        var HOW_DRASTIC = emitter.colorShiftMagnitude
        if (particle.isOccasion(HOW_OFTEN, msPassed)) {
            particle.colorShiftR = splitTime.randomRanged(-HOW_DRASTIC, HOW_DRASTIC)
            particle.colorShiftG = splitTime.randomRanged(-HOW_DRASTIC, HOW_DRASTIC)
            particle.colorShiftB = splitTime.randomRanged(-HOW_DRASTIC, HOW_DRASTIC)
        }
        particle.r = splitTime.constrain(particle.r + particle.colorShiftR, 0, 255)
        particle.g = splitTime.constrain(particle.g + particle.colorShiftG, 0, 255)
        particle.b = splitTime.constrain(particle.b + particle.colorShiftB, 0, 255)
    }

    export function applyOpacityShift(
        emitter: ParticleEmitter,
        particle: Particle,
        msPassed: number
    ): void {
        var HOW_OFTEN = emitter.opacityShiftIntervalMs
        var HOW_DRASTIC = emitter.opacityShiftMagnitude
        if (particle.isOccasion(HOW_OFTEN, msPassed)) {
            particle.opacityShift = splitTime.randomRanged(-HOW_DRASTIC, HOW_DRASTIC)
        }
        particle.opacity = splitTime.constrain(
            particle.opacity + particle.opacityShift,
            0,
            1
        )
    }

    export function generateDefaultParticle(
        emitter: ParticleEmitter
    ): Particle {
        return new splitTime.particles.Particle(
            new splitTime.Vector2D(
                emitter.location.x + Math.random() * 32 - 16,
                emitter.location.y -
                    emitter.location.z +
                    Math.random() * 32 -
                    16
            ),
            splitTime.Vector2D.angular(
                splitTime.randomRanged(0, 2 * Math.PI),
                Math.random() * 16
            ),
            new splitTime.Vector2D(0, 10)
        )
    }

    export class ParticleEmitter implements splitTime.body.Drawable {
        _particles: Particle[]
        _lastParticleGenerated: number
        _currentTime: number
        maxParticleAgeMs: number
        stopEmissionsAfter: number
        generateIntervalMs: number
        location: ReadonlyCoordinates3D
        generateParticle: (emitter: ParticleEmitter) => Particle
        _particlesGoneHandlers: splitTime.RegisterCallbacks
        xres: number
        yres: number
        lazyIntervalMs: number
        lazyMagnitude: number
        opacityShiftIntervalMs: number
        opacityShiftMagnitude: number
        colorShiftIntervalMs: number
        colorShiftMagnitude: number
        lightIntensity: number = 0
        constructor(
            location: ReadonlyCoordinates3D,
            particleGenerator: (emitter: ParticleEmitter) => Particle
        ) {
            this._particles = []
            this._lastParticleGenerated = -1000
            this._currentTime = 0
            this.maxParticleAgeMs = 5000
            this.stopEmissionsAfter = 0
            this.generateIntervalMs = 100
            this.location = location
            this.generateParticle = particleGenerator || generateDefaultParticle

            this._particlesGoneHandlers = new splitTime.RegisterCallbacks()

            this.xres = 100
            this.yres = 100

            this.lazyIntervalMs = 2000
            this.lazyMagnitude = 0

            this.opacityShiftIntervalMs = 2000
            this.opacityShiftMagnitude = 0

            this.colorShiftIntervalMs = 2000
            this.colorShiftMagnitude = 0
        }

        playerOcclusionFadeFactor = 0.3
        opacityModifier: number = 1

        spawn(n: number) {
            n = n || 1
            for (var i = 0; i < n; i++) {
                this._particles.push(this.generateParticle(this))
                this._lastParticleGenerated = this._currentTime
            }
        }

        advanceTime(msPassed: number) {
            var STEP = 40
            for (var i = 0; i < msPassed; i += STEP) {
                this._advanceTimeStep(STEP)
            }
            this._advanceTimeStep(msPassed % STEP)
        }

        _advanceTimeStep(msPassed: number) {
            this._currentTime += msPassed
            // var regenerateCount = 0;
            for (
                var iParticle = 0;
                iParticle < this._particles.length;
                iParticle++
            ) {
                var particle = this._particles[iParticle]
                particle.advanceTime(this, msPassed)

                if (particle.age > this.maxParticleAgeMs) {
                    this._particles.splice(iParticle, 1)
                    iParticle--
                    // regenerateCount++;
                }
            }
            if (
                this.stopEmissionsAfter <= 0 ||
                this._currentTime <= this.stopEmissionsAfter
            ) {
                var timePassedSinceLastGeneration =
                    this._currentTime - this._lastParticleGenerated
                var randomFactor = Math.random() / 2 + 0.75
                var howManyToSpawn = Math.round(
                    (randomFactor * timePassedSinceLastGeneration) /
                        this.generateIntervalMs
                )
                if (howManyToSpawn > 0) {
                    this.spawn(howManyToSpawn)
                }
            }
            // this.spawn(regenerateCount);

            if (
                this._particles.length === 0 &&
                this._currentTime > this.stopEmissionsAfter
            ) {
                this._particlesGoneHandlers.run()
            }
        }

        getCanvasRequirements(x: number, y: number, z: number) {
            var canvReq = new splitTime.body.CanvasRequirements(
                Math.round(x),
                Math.round(y),
                Math.round(z),
                this.xres,
                this.yres
            )
            canvReq.translateOrigin = false
            return canvReq
        }

        /**
         * @param {GenericCanvasRenderingContext2D} ctx
         */
        draw(ctx: GenericCanvasRenderingContext2D) {
            var initialOpacity = ctx.globalAlpha
            for (
                var iParticle = 0;
                iParticle < this._particles.length;
                iParticle++
            ) {
                var particle = this._particles[iParticle]
                ctx.beginPath()
                ctx.fillStyle = particle.getFillStyle()
                ctx.globalAlpha = initialOpacity * particle.opacity
                ctx.arc(
                    particle.x,
                    particle.y,
                    particle.radius,
                    0,
                    Math.PI * 2,
                    true
                )
                ctx.closePath()
                ctx.fill()
            }
        }

        applyLighting(ctx: GenericCanvasRenderingContext2D, intensity: number): void {
            if (this.lightIntensity <= 0 || intensity <= 0) {
                return
            }
            const initialAlpha = ctx.globalAlpha
            try {
                ctx.globalAlpha = intensity * this.lightIntensity
                this.draw(ctx)
            } finally {
                ctx.globalAlpha = initialAlpha
            }
        }

        notifyFrameUpdate(delta: number) {
            // Do nothing
        }

        notifyTimeAdvance(delta: number) {
            this.advanceTime(delta * 1000)
        }

        prepareForRender() {
            // TODO maybe
        }
        cleanupAfterRender() {
            // TODO maybe
        }

        registerParticlesGoneHandler(handler: () => void) {
            this._particlesGoneHandlers.register(handler)
        }

        /**
         * @param {splitTime.Level} level
         */
        put(level: splitTime.Level) {
            var tempBody = new splitTime.Body()
            tempBody.baseLength = 0
            tempBody.put(
                level,
                this.location.x,
                this.location.y,
                this.location.z
            )
            tempBody.drawable = this
            this.registerParticlesGoneHandler(function() {
                tempBody.clearLevel()
            })
        }

        getLight(): ParticleEmitter {
            return this
        }

        clone(): ParticleEmitter {
            throw new Error("not yet implemented")
        }
    }
}
