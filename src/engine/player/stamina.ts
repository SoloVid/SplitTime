namespace splitTime.player {

    export enum StaminaState {
        GOOD,
        MEDIOCRE,
        FAILING
    }

    /**
     * Stamina is a somewhat abstract concept centered around
     * the idea of a character passing out when it gets to zero.
     * 
     * We'll think of stamina in terms of how many more hours
     * you could go before passing out
     */
    export class Stamina {
        conscious: boolean = true
        private readonly koListeners = new splitTime.RegisterCallbacks()
        private readonly wakeListeners = new splitTime.RegisterCallbacks()

        constructor(
            public max: number = 0,
            public current: number = 0
        ) {}

        registerKOListener(listener: () => splitTime.CallbackResult) {
            this.koListeners.register(listener)
        }

        registerWakeListener(listener: () => splitTime.CallbackResult) {
            this.wakeListeners.register(listener)
        }

        isConscious(): boolean {
            return this.conscious
        }

        getState(): StaminaState {
            const fractionAvailable = this.current / this.max
            if (fractionAvailable > 0.5) {
                return StaminaState.GOOD
            }
            if (fractionAvailable > 0.25) {
                return StaminaState.MEDIOCRE
            }
            return StaminaState.FAILING
        }

        hit(howMuch: number): void {
            const prevAmount = this.current
            this.current -= howMuch
            if (prevAmount > 0 && this.current <= 0) {
                this.conscious = false
                this.koListeners.run()
            }
        }

        add(howMuch: number): void {
            this.current = Math.min(this.current + howMuch, this.max)
            if (this.current >= this.max) {
                this.conscious = true
                this.wakeListeners.run()
            }
        }
    }
}