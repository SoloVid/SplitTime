namespace splitTime.agent {

    // class NewMeanderer implements TimeNotified, npc.Behavior {
    //     pixels: number = 0

    //     isComplete(): boolean {
    //         return false
    //     }

    //     notifySuspension(): void {
    //         // Do nothing
    //     }

    //     notifyTimeAdvance(delta: game_seconds): void {
    //         if (this.levelManager.getCurrent() !== this.spriteBody.body.level) {
    //             return
    //         }
    //         this.base.regularMotion(delta, randomInt(16) + 16, direction.getRandom())
    //     }
    // }

    class BaseMeanderer {
        pixels: number = 0
        counter: Signaler | null = null
        speed: number = 32

        constructor(private readonly spriteBody: SpriteBody) {
        }

        private get body(): Body {
            return this.spriteBody.body
        }

        regularMotion(delta: game_seconds, newSteps: number, newDir: direction_t) {
            if(this.pixels > 0) {
                this.spriteBody.sprite.requestStance("walk", this.body.dir)
                var pixelsThisFrame = delta * this.speed
                this.body.mover.zeldaBump(this.body.dir, pixelsThisFrame)
                this.pixels -= pixelsThisFrame;
                if(this.pixels <= 0) {
                    this.counter = this.body.getLevel().getRegion().getTimeStabilizer(1000 + splitTime.randomInt(1000))
                }
            } else if(this.counter !== null) {
                // Prevent walking animation
                // if (this.body.drawable instanceof Sprite) {
                //     this.body.drawable.resetStance()
                // }
                
                if(this.counter.isSignaling()) {
                    this.counter = null;
                }
            } else if(this.pixels <= 0) {
                this.body.dir = newDir
                this.pixels = newSteps
            }
        }
    }

    enum MeanderState {
        WAITING = "WAITING",
        WALKING = "WALKING"
    }

    export function makeMeanderingBehavior(npc: Npc, home: ILevelLocation2): npc.Behavior {
        let state = MeanderState.WAITING
        let waitUntil: game_seconds = 0
        let dir = direction.S
        const stateMachine = new splitTime.npc.BehaviorStateMachine(() => state)
        npc.body.registerTimeAdvanceListener(delta => {
            const time = npc.body.level.getRegion().getTime()
            if (time >= waitUntil) {
                if (state === MeanderState.WAITING) {
                    walk()
                } else {
                    wait()
                }
            }
        })
        function wait() {
            state = MeanderState.WAITING
            waitUntil = npc.body.level.getRegion().getTime() + splitTime.randomRanged(1, 2)
        }
        function walk() {
            state = MeanderState.WALKING
            dir = direction.getRandom()
            // 33% chance of just going back to home location
            if (Math.random() < 0.33) {
                dir = direction.fromToThing(npc.body, home)
            }
            waitUntil = npc.body.level.getRegion().getTime() + splitTime.randomRanged(1, 3)
        }
        stateMachine.set(MeanderState.WAITING, {
            notifyTimeAdvance() {
                npc.movementAgent.setStopped()
            }
        })
        stateMachine.set(MeanderState.WALKING, {
            notifyTimeAdvance() {
                npc.movementAgent.setWalkingDirection(dir)
            },
            notifySuspension: wait
        })
        return stateMachine
    }
    
    export class RandomMeandering implements TimeNotified, npc.Behavior {
        private base: BaseMeanderer
        constructor(
            private readonly spriteBody: SpriteBody,
            private readonly levelManager: LevelManager
        ) {
            this.base = new BaseMeanderer(spriteBody)
        }

        notifyTimeAdvance(delta: game_seconds): void {
            if (this.levelManager.getCurrent() !== this.spriteBody.body.level) {
                return
            }
            this.base.regularMotion(delta, randomInt(16) + 16, direction.getRandom())
        }
    }
    export class LineMeandering implements TimeNotified, npc.Behavior {
        private base: BaseMeanderer
        constructor(private readonly spriteBody: SpriteBody) {
            this.base = new BaseMeanderer(spriteBody)
        }
        
        notifyTimeAdvance(delta: game_seconds): void {
            this.base.regularMotion(delta, 64, Math.round((this.spriteBody.body.dir + 2)%4))
        }
    }
    export class SquareMeandering implements TimeNotified, npc.Behavior {
        private base: BaseMeanderer
        constructor(private readonly spriteBody: SpriteBody) {
            this.base = new BaseMeanderer(spriteBody)
        }
        
        notifyTimeAdvance(delta: game_seconds): void {
            this.base.regularMotion(delta, 64, Math.round((this.spriteBody.body.dir + 1)%4))
        }
    }
}