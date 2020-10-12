namespace G.soldier {

    export function make(): splitTime.Body {
        const body = G.BODY_TEMPLATES.getInstance("Base Soldier")
        const npc = makeNpc(body)
        body.registerTimeAdvanceListener(npc.behavior)
        const chaseBehavior = new ChaseBehavior(npc)
        body.registerTimeAdvanceListener(delta => {
            if (splitTime.body.canDetect(body, G.player.getActiveBody())) {
                npc.behavior.set(chaseBehavior, splitTime.npc.PRIORITY)
            }
        })
        let knocking = false
        attackEvent.registerListener(body, data => {
            if (!knocking) {
                knocking = true
                splitTime.knockBack(body, data.direction, 512, 0.1).then(() => knocking = false)
            }
        })
        return body
    }

    export const NAME = "Base Soldier"

    G.BODY_TEMPLATES.register(NAME, function() {
        var sprite = new splitTime.Sprite(
            "people/soldier.png"
        )
        sprite.baseOffY = -4
        sprite.xres = 32
        sprite.yres = 64
        sprite.light = new splitTime.body.SpotLight(0.5)

        // var particleEmitter = new splitTime.ParticleEmitter();
        // particleEmitter.advanceTime(10000);

        var body = new splitTime.Body()
        // body.name = "Soldier";
        body.baseOffY = -4
        body.drawable = sprite
        // body.drawable = particleEmitter;
        body.height = 56
        // body.hp = 70;
        // body.strg = 70;
        body.spd = 64
        return body
    })

    function makeNpc(body: splitTime.Body): splitTime.Npc {
        const npc = new splitTime.Npc(body, body.drawable as splitTime.Sprite)
        npc.behavior.set(
            new splitTime.agent.RandomMeandering(body, G.perspective.levelManager),
            splitTime.npc.IDLE
        )
        return npc
    }

    class ChaseBehavior implements splitTime.npc.Behavior {

        private timeWithoutSeeing: splitTime.game_seconds = 0
        BLIND_TIME: splitTime.game_seconds = 2
        TERMINATION_TIME: splitTime.game_seconds = 5
        slashAbility: splitTime.SlashAbility

        constructor(
            private readonly npc: splitTime.Npc
        ) {
            this.slashAbility = new splitTime.SlashAbility(this.npc.body)
        }

        private inLevel(): boolean {
            return this.npc.body.getLevel() === G.player.getActiveBody().getLevel()
        }

        isComplete(): boolean {
            return !this.inLevel() || this.timeWithoutSeeing > this.TERMINATION_TIME
        }
        notifySuspension(): void {
            // FTODO: Anything here?
        }
        notifyTimeAdvance(delta: splitTime.game_seconds): void {
            if (!this.inLevel()) {
                return
            }

            const pb = G.player.getActiveBody()
            const b = this.npc.body

            if (splitTime.body.canDetect(b, pb)) {
                this.timeWithoutSeeing = 0
            }

            if (this.timeWithoutSeeing < this.BLIND_TIME) {
                const targetDir = splitTime.direction.fromToThing(b, pb)
                const TURN_SPEED = 4
                b.dir = splitTime.direction.approach(b.dir, targetDir, delta * TURN_SPEED)
                if (splitTime.direction.areWithin90Degrees(targetDir, b.dir, 0.5)) {
                    this.npc.sprite.requestStance("run", b.dir)
                    b.mover.zeldaBump(delta * b.spd, b.dir)

                    const range = this.slashAbility.radius + (this.slashAbility.hitBoxWidth / 2)
                    const FRACTION_SECOND_IMPERFECTION = 0.2
                    const imperfectionPixels = FRACTION_SECOND_IMPERFECTION * b.spd
                    const attackDistance = range - imperfectionPixels
                    if (splitTime.measurement.distanceTrue(b.x, b.y, pb.x, pb.y) - pb.halfBaseLength < attackDistance) {
                        // TODO: cooldown
                        this.slashAbility.use()
                    }
                } else {
                    // FTODO: explicit stance?
                    this.npc.sprite.requestStance(splitTime.Sprite.DEFAULT_STANCE, b.dir, true)
                }
            } else {
                // Do nothing (wait)
                // FTODO: Maybe look around?
            }
        }
    }
}
