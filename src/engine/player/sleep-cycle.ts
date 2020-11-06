namespace splitTime.player {
    export class SleepCycle implements splitTime.TimeNotified {
        inBed: boolean = false

        constructor(
            private readonly body: splitTime.Body,
            private readonly stamina: Stamina,
            private readonly worldRenderer: WorldRenderer,
            public onKO: () => void = () => {},
            public onWake: () => void = () => {}
        ) {
            this.stamina.registerKOListener(() => {
                this.worldRenderer.fadeTo(new splitTime.light.Color(0,0,0)).then(() => {
                    this.onKO()
                    this.worldRenderer.fadeIn()
                })
            })
        }

        notifyTimeAdvance(delta: splitTime.game_seconds) {
            const timeline = this.body.getLevel().getRegion().getTimeline()
            const hoursPassed = delta / timeline.kSecondsPerMinute / timeline.kMinutesPerHour
            if (this.stamina.isConscious()) {
                this.stamina.hit(hoursPassed)
            } else {
                // TODO: change up restfulness in bed
                // TODO: change to appropriate number
                const hoursFullRest = 10
                // TODO: make non-linear?
                this.stamina.add(hoursPassed * (this.stamina.max / hoursFullRest))

                // TODO: add oversleep?
                if (this.stamina.isConscious()) {
                    this.worldRenderer.fadeTo(new splitTime.light.Color(0,0,0)).then(() => {
                        this.onWake()
                        this.worldRenderer.fadeIn()
                    })
                }
            }
        }
    }
}
