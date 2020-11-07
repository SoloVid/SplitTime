namespace splitTime.player {

    // TODO: Where should this comment move to?
    /**
     * Stamina is a somewhat abstract concept centered around
     * the idea of a character passing out when it gets to zero.
     * 
     * We'll think of stamina in terms of how many more hours
     * you could go before passing out
     */
    export class MeteredStat {
        conscious: boolean = true
        private readonly emptyListeners = new splitTime.RegisterCallbacks()
        private readonly maxedListeners = new splitTime.RegisterCallbacks()

        constructor(
            public max: number = 0,
            public current: number = 0
        ) {}

        registerEmptyListener(listener: () => splitTime.CallbackResult) {
            this.emptyListeners.register(listener)
        }

        registerMaxedListener(listener: () => splitTime.CallbackResult) {
            this.maxedListeners.register(listener)
        }

        isFull(): boolean {
            return this.current >= this.max
        }

        isEmpty(): boolean {
            return this.current <= 0
        }

        hit(howMuch: number): void {
            const prevAmount = this.current
            this.current -= howMuch
            if (prevAmount > 0 && this.current <= 0) {
                this.conscious = false
                this.emptyListeners.run()
            }
        }

        add(howMuch: number): void {
            this.current = Math.min(this.current + howMuch, this.max)
            if (this.current >= this.max) {
                this.conscious = true
                this.maxedListeners.run()
            }
        }
    }
}