namespace splitTime.agent {
    class BaseMeanderer {
        pixels: number = 0
        counter: Signaler | null = null

        constructor(private readonly body: splitTime.Body) {
        }

        regularMotion(delta: game_seconds, newSteps: number, newDir: direction_t) {
            if(this.pixels > 0) {
                if (this.body.drawable instanceof Sprite) {
                    this.body.drawable.requestStance("walk", newDir)
                }
                var pixelsThisFrame = delta * this.body.spd
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
    
    export class RandomMeandering implements TimeNotified, npc.Behavior {
        private base: BaseMeanderer
        constructor(
            private readonly body: Body,
            private readonly levelManager: LevelManager
        ) {
            this.base = new BaseMeanderer(body)
        }

        isComplete(): boolean {
            return false
        }

        notifySuspension(): void {
            // Do nothing
        }

        notifyTimeAdvance(delta: game_seconds): void {
            if (this.levelManager.getCurrent() !== this.body.level) {
                return
            }
            this.base.regularMotion(delta, randomInt(16) + 16, direction.getRandom())
        }
    }
    export class LineMeandering implements TimeNotified, npc.Behavior {
        private base: BaseMeanderer
        constructor(private readonly body: Body) {
            this.base = new BaseMeanderer(body)
        }
        
        isComplete(): boolean {
            return false
        }

        notifySuspension(): void {
            // Do nothing
        }

        notifyTimeAdvance(delta: game_seconds): void {
            this.base.regularMotion(delta, 64, Math.round((this.body.dir + 2)%4))
        }
    }
    export class SquareMeandering implements TimeNotified, npc.Behavior {
        private base: BaseMeanderer
        constructor(private readonly body: Body) {
            this.base = new BaseMeanderer(body)
        }
        
        isComplete(): boolean {
            return false
        }

        notifySuspension(): void {
            // Do nothing
        }

        notifyTimeAdvance(delta: game_seconds): void {
            this.base.regularMotion(delta, 64, Math.round((this.body.dir + 1)%4))
        }
    }
}