namespace splitTime.particles {
    export class Particle {
        seed: number = Math.random()
        /** Milliseconds since spawned */
        age: number = 0
        maxParticleAgeMs: number = 5000
        position: Vector2D = new Vector2D(0, 0)
        velocity: Vector2D = new Vector2D(0, 0)
        acceleration: Vector2D = new Vector2D(0, 0)
        radius: number = 4
        color: light.Color = new light.Color(255, 255, 255, 0.8)
        colorShift: light.Color = new light.Color(0, 0, 0, 0)
        lightRadius: number = this.radius
        lightIntensity: number = 0

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
        particle.position.x += particle.velocity.x * seconds
        particle.position.y += particle.velocity.y * seconds
        particle.velocity.x += particle.acceleration.x * seconds
        particle.velocity.y += particle.acceleration.y * seconds
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
            particle.acceleration.x = splitTime.randomRanged(-HOW_DRASTIC, HOW_DRASTIC)
            particle.acceleration.y = splitTime.randomRanged(-HOW_DRASTIC, HOW_DRASTIC)
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
            particle.colorShift.r = splitTime.randomRanged(-HOW_DRASTIC, HOW_DRASTIC)
            particle.colorShift.g = splitTime.randomRanged(-HOW_DRASTIC, HOW_DRASTIC)
            particle.colorShift.b = splitTime.randomRanged(-HOW_DRASTIC, HOW_DRASTIC)
        }
        particle.color.r = splitTime.constrain(particle.color.r + particle.colorShift.r, 0, 255)
        particle.color.g = splitTime.constrain(particle.color.g + particle.colorShift.g, 0, 255)
        particle.color.b = splitTime.constrain(particle.color.b + particle.colorShift.b, 0, 255)
    }

    export function applyOpacityShift(
        emitter: ParticleEmitter,
        particle: Particle,
        msPassed: number
    ): void {
        var HOW_OFTEN = emitter.opacityShiftIntervalMs
        var HOW_DRASTIC = emitter.opacityShiftMagnitude
        if (particle.isOccasion(HOW_OFTEN, msPassed)) {
            particle.colorShift.a = splitTime.randomRanged(-HOW_DRASTIC, HOW_DRASTIC)
        }
        particle.color.a = splitTime.constrain(
            particle.color.a + particle.colorShift.a,
            0,
            1
        )
    }

    export function generateDefaultParticle(
        emitter: ParticleEmitter
    ): Particle {
        const p = new splitTime.particles.Particle()
        p.position = new splitTime.Vector2D(
            emitter.location.x + Math.random() * 32 - 16,
            emitter.location.y -
                emitter.location.z +
                Math.random() * 32 -
                16
        )
        p.velocity = splitTime.Vector2D.angular(
            splitTime.randomRanged(0, 2 * Math.PI),
            Math.random() * 16
        )
        p.acceleration = new splitTime.Vector2D(0, 10)
        return p
    }

    export class ParticleEmitter implements splitTime.body.Drawable {
        _particles: Particle[] = []
        _lastParticleGenerated: number = 0
        _currentTime: number = 0
        /** How long to generate particles or 0 for infinite stream */
        stopEmissionsAfter: number = 0
        /** Milliseconds between particle generations */
        generateIntervalMs: number = 100
        /** 1 means the max amount come out right at the beginning */
        explosiveness: number = 0
        location: Readonly<Coordinates3D>
        generateParticle: (emitter: ParticleEmitter) => Particle
        _particlesGoneHandlers: splitTime.RegisterCallbacks = new splitTime.RegisterCallbacks()
        xres: number = 100
        yres: number = 100
        lazyIntervalMs: number = 2000
        lazyMagnitude: number = 0
        opacityShiftIntervalMs: number = 2000
        opacityShiftMagnitude: number = 0
        colorShiftIntervalMs: number = 2000
        colorShiftMagnitude: number = 0
        constructor(
            location: Readonly<Coordinates3D>,
            particleGenerator: (emitter: ParticleEmitter) => Particle
        ) {
            this.location = location
            this.generateParticle = particleGenerator || generateDefaultParticle
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
            for (var i = 0; i < msPassed - STEP; i += STEP) {
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

                if (particle.age > particle.maxParticleAgeMs) {
                    this._particles.splice(iParticle, 1)
                    iParticle--
                    // regenerateCount++;
                }
            }
            if (
                this.stopEmissionsAfter <= 0 ||
                this._currentTime <= this.stopEmissionsAfter
            ) {
                let timePassedSinceLastGeneration =
                    this._currentTime - this._lastParticleGenerated
                if (this._lastParticleGenerated === 0) {
                    // TODO: re-figure this since maxParticleAgeMs is now part of Particle
                    // timePassedSinceLastGeneration += this.explosiveness * this.maxParticleAgeMs
                }
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

        getDesiredOrigin(whereDefaultWouldBe: Coordinates3D): Coordinates3D {
            return new Coordinates3D(0, 0, 0)
        }

        getCanvasRequirements(): splitTime.body.CanvasRequirements {
            return new splitTime.body.CanvasRequirements(
                math.Rect.make(-this.xres / 2, -this.yres / 2, this.xres, this.yres)
            )
        }

        draw(ctx: GenericCanvasRenderingContext2D) {
            const initialOpacity = ctx.globalAlpha
            for (const particle of this._particles) {
                ctx.beginPath()
                ctx.fillStyle = particle.color.cssString
                // ctx.globalAlpha = initialOpacity * particle.color.a
                ctx.arc(
                    particle.position.x,
                    particle.position.y,
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
            for (const particle of this._particles) {
                ctx.beginPath()
                const lightColor = new light.Color(particle.color.r, particle.color.g, particle.color.b, intensity * particle.lightIntensity)
                ctx.fillStyle = lightColor.cssString
                ctx.arc(
                    particle.position.x,
                    particle.position.y,
                    particle.lightRadius,
                    0,
                    Math.PI * 2,
                    true
                )
                ctx.closePath()
                ctx.fill()
            }
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
            tempBody.width = 0
            tempBody.depth = 0
            tempBody.height = 0
            tempBody.put(
                level,
                this.location.x,
                this.location.y,
                this.location.z
            )
            tempBody.drawables.push(this)
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
