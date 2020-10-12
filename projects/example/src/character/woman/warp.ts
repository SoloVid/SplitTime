namespace G.woman {
    export class Warp implements splitTime.player.ability.IAbility {
        body: splitTime.Body
        private cooldown: splitTime.game_seconds
        private cooldownUntil: splitTime.game_seconds

        constructor(body: splitTime.Body) {
            this.body = body
            this.cooldown = 0
            //this.cooldownMs = 500;
            this.cooldownUntil = 0
        }

        use(): boolean {
            var level = this.body.getLevel()
            var time = level.getRegion().getTime()
            if (time < this.cooldownUntil) {
                return false
            }

            var dir = this.body.dir
            var warper = new splitTime.body.Warper(this.body)
            var distanceMoved = warper.warp(dir, 96)

            if (distanceMoved > 0) {
                this.cooldownUntil = time + this.cooldown

                // We calculate initialLocation after in the event that the body changed levels
                var dx = splitTime.direction.getXMagnitude(dir) * distanceMoved
                var dy = splitTime.direction.getYMagnitude(dir) * distanceMoved
                var initialLocation = {
                    x: this.body.x - dx,
                    y: this.body.y - dy,
                    z: this.body.z
                }

                var GHOST_SPACING = 16
                var numberOfGhosts = Math.floor(distanceMoved / GHOST_SPACING)
                var dxStep = dx / numberOfGhosts
                var dyStep = dy / numberOfGhosts

                for (var iGhost = 0; iGhost < numberOfGhosts; iGhost++) {
                    var percent = iGhost / numberOfGhosts
                    var gX = initialLocation.x + iGhost * dxStep
                    var gY = initialLocation.y + iGhost * dyStep
                    var ABS_MAX_OPACITY = 0.7
                    var maxOpacity = ABS_MAX_OPACITY - 0.4 * (1 - percent)
                    // Make sure some ghosts show up
                    if (numberOfGhosts <= 2) {
                        maxOpacity = ABS_MAX_OPACITY - 0.1 * (1 - percent)
                    }
                    const gBody = this.drawGhost(
                        gX,
                        gY,
                        this.body.z,
                        (1 - percent) * maxOpacity,
                        maxOpacity
                    )
                    const gSprite = gBody.drawable
                    if (gSprite instanceof splitTime.Sprite) {
                        gSprite.frame =
                            gSprite.frame +
                            (iGhost % gSprite.getAnimationFramesAvailable())
                    }
                }

                this.drawInkOut(
                    initialLocation.x,
                    initialLocation.y,
                    initialLocation.z
                )

                return true
            }

            return false
        }

        drawGhost(
            x: number,
            y: number,
            z: number,
            startOpacity: number,
            maxOpacity: number
        ): splitTime.Body {
            const location = {
                x: x,
                y: y,
                z: z,
                level: this.body.level
            }
            const ghost = splitTime.body.createGhost(this.body, location)
            const sprite = ghost.drawable
            if (!(sprite instanceof splitTime.Sprite)) {
                throw new Error("Drawable for warping body isn't a Sprite!?")
            }
            // sprite.light = new splitTime.body.SpotLight(0)
            sprite.light = null
            splitTime.body.fadeInBody(ghost, startOpacity, maxOpacity)
            .then(() => splitTime.body.fadeOutBody(ghost))
            .then(() => ghost.clearLevel())
            return ghost
        }

        private drawInkOut(x: number, y: number, z: number) {
            var that = this
            var particles = new splitTime.particles.ParticleEmitter(
                { x: x, y: y, z: z },
                function(emitter) {
                    var p = new splitTime.particles.Particle(
                        new splitTime.Vector2D(
                            splitTime.randomRanged(
                                emitter.location.x - 16,
                                emitter.location.x + 16
                            ),
                            splitTime.randomRanged(
                                emitter.location.y - 24,
                                emitter.location.y + 24
                            ) -
                                emitter.location.z -
                                that.body.height / 4
                        ),
                        splitTime.Vector2D.angular(
                            splitTime.randomRanged(0, 2 * Math.PI),
                            Math.random() * 16
                        ),
                        new splitTime.Vector2D(0, 10)
                    )
                    p.radius = 10
                    p.r = 80
                    p.g = 50
                    p.b = 120
                    return p
                }
            )
            particles.generateIntervalMs = 400
            particles.maxParticleAgeMs = 1200
            particles.stopEmissionsAfter = 2000
            particles.explosiveness = .5
            particles.colorShiftMagnitude = 5
            // particles.lightIntensity = 0.5
            particles.put(this.body.getLevel())
        }
    }
}
