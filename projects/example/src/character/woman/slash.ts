namespace splitTime {

    export function knockBack(body: Body, dir: direction_t, speed: number, duration: game_seconds, zVelocityBump: number = 0): PromiseLike<void> {
        const pledge = new Pledge()
        let knockBackTime = 0
        body.zVelocity = zVelocityBump
        body.registerTimeAdvanceListener(delta => {
            if (!body.level.isLoaded() || knockBackTime > duration) {
                pledge.resolve()
                return splitTime.STOP_CALLBACKS
            }
            body.mover.zeldaBump(delta * speed, dir)
            knockBackTime += delta
            return
        })
        return pledge
    }

    export class SlashAbility implements splitTime.player.ability.IAbility {

        radiansWide: number = Math.PI * 0.5
        radius: number = 24
        hitBoxWidth: number = 16
        duration: game_seconds = 0.08
        extraParticleTime: number = 0.03

        constructor(
            private readonly body: Body
        ) {}

        use(): boolean {
            const slashBody = new splitTime.Body()
            slashBody.baseLength = 0

            const that = this
            const particles = new splitTime.particles.ParticleEmitter(
                slashBody,
                function(emitter) {
                    var p = new splitTime.particles.Particle(
                        new splitTime.Vector2D(
                            emitter.location.x + splitTime.randomRanged(-5, 5),
                            emitter.location.y - emitter.location.z + splitTime.randomRanged(-5, 5)
                        ),
                        new splitTime.Vector2D(0, 0),
                        new splitTime.Vector2D(0, 0)
                    )
                    p.radius = 6
                    p.r = 200
                    p.g = 220
                    p.b = 255
                    p.opacity = 0.5
                    return p
                }
            )
            particles.generateIntervalMs = 5
            particles.maxParticleAgeMs = 50
            particles.stopEmissionsAfter = (this.duration + this.extraParticleTime) * 1000
            particles.lightIntensity = .05

            slashBody.drawable = particles

            // slashBody.putInLocation(new splitTime.InFrontOfBody(this.body, 64))
            slashBody.putInLocation(this.body)
            let secondsPassed = 0
            slashBody.registerTimeAdvanceListener(delta => {
                const angle = -((secondsPassed / this.duration) - 0.5) * this.radiansWide
                slashBody.putInLocation(new splitTime.InFrontOfBody(this.body, this.radius, angle, this.body.height * 0.7))
                secondsPassed += delta
                if (secondsPassed > this.duration) {
                    secondsPassed = this.duration
                    // TODO: stop (functionally) slash
                } else {
                    const collisionInfo = splitTime.COLLISION_CALCULATOR.calculateVolumeCollision(
                        slashBody.level,
                        slashBody.x - this.hitBoxWidth / 2, this.hitBoxWidth,
                        slashBody.y - this.hitBoxWidth / 2, this.hitBoxWidth,
                        slashBody.z - this.hitBoxWidth / 2, this.hitBoxWidth,
                        [slashBody, this.body],
                        true
                    )
                    for (const b of collisionInfo.bodies) {
                        G.attackEvent.trigger(b, {
                            direction: direction.fromRadians(direction.toRadians(this.body.dir, false), false),
                            damage: 5
                        })
                    }
                }
            })
            particles.registerParticlesGoneHandler(() => slashBody.clearLevel())

            return true
        }
    }
}