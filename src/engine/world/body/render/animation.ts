namespace splitTime {
    const DUMMY_SECONDS = 2

    export class Animation implements TimeNotified, npc.Behavior {

        private secondsPassed = 0
        private callbackHandler = new RegisterCallbacks()

        constructor(
            private readonly sprite: Sprite,
            private readonly stance: string
        ) {

        }

        notifyTimeAdvance(delta: number): void {
            // TODO: actually implement
            if (this.secondsPassed === 0) {
                log.debug("Playing animation " + this.stance)
            }
            this.secondsPassed += delta
            if (this.isComplete()) {
                log.debug("Animation " + this.stance + " complete")
                this.callbackHandler.run()
            }
        }

        isComplete(): boolean {
            return this.secondsPassed > DUMMY_SECONDS
        }

        onComplete(callback: Callback): void {
            this.callbackHandler.register(callback)
        }

        notifySuspension(): void {
            // TODO: implement (probably back to default)
            log.debug("Animation suspended")
        }
    }
}