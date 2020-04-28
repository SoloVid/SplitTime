namespace splitTime {
    export type game_seconds = number
    export type game_ms = number
    export type real_seconds = number
    export type real_ms = number

    function toMs(seconds: number): number {
        return seconds * 1000
    }

    function toSeconds(ms: number): number {
        return ms / 1000
    }

    class ScheduledEvent {
        public readonly timeMs: game_ms
        constructor(
            public readonly time: game_seconds,
            public readonly instance: time.EventInstance<any>
        ) {
            this.timeMs = toMs(this.time)
        }
    }

    export class Timeline {
        _time: game_seconds = 0
        _timeAdvanceListeners: splitTime.RegisterCallbacks = new splitTime.RegisterCallbacks()
        _regions: splitTime.Region[] = []

        private upcomingEvents: ScheduledEvent[] = []

        readonly beginning: time.Moment = new time.Moment()
        kSecondsPerRealSecond: game_seconds = 1
        kSecondsPerMinute = 60
        kMinutesPerHour = 60
        kHoursPerDay = 24

        constructor(public readonly id: string) {}

        registerTimeAdvanceListener(listener: (delta: game_seconds) => any) {
            this._timeAdvanceListeners.register(listener)
        }

        addRegion(region: splitTime.Region) {
            this._regions.push(region)
        }
        removeRegion(region: splitTime.Region) {
            var regionIndex = this._regions.indexOf(region)
            if (regionIndex >= 0) {
                this._regions.splice(regionIndex, 1)
            } else if (splitTime.debug.ENABLED) {
                splitTime.log.warn(
                    "Attempted to remove region " +
                        region.id +
                        " from non-parent timeline"
                )
            }
        }

        getTimeMs(): game_ms {
            return toMs(this._time)
        }

        getTime(): game_seconds {
            return this._time
        }

        advance(seconds: game_seconds) {
            const beginning = this.beginning.getTime()
            if (this._time < beginning) {
                this._time = beginning
            }

            const newTime = this._time + seconds

            // Run scheduled events
            while (
                this.upcomingEvents.length > 0 &&
                this.upcomingEvents[0].time <= newTime
            ) {
                const event = this.upcomingEvents.shift() as ScheduledEvent
                // Update time along the way in case someone cares
                this._time = event.time
                event.instance.run()
            }

            // Move time fully ahead
            this._time = newTime

            // Notify listeners
            this._timeAdvanceListeners.run(seconds)
            for (var i = 0; i < this._regions.length; i++) {
                this._regions[i].notifyTimeAdvance(seconds, newTime)
            }
        }

        notifyFrameUpdate(delta: real_seconds) {
            this.advance(delta * this.kSecondsPerRealSecond)
        }

        second(seconds: number): game_seconds {
            return seconds
        }

        minute(minutes: number): game_seconds {
            return minutes * this.second(this.kSecondsPerMinute)
        }

        hour(hours: number): game_seconds {
            return hours * this.minute(this.kMinutesPerHour)
        }

        day(days: number): game_seconds {
            return days * this.hour(this.kHoursPerDay)
        }

        schedule<T extends file.jsonable | void>(
            moment: time.Moment,
            eventInstance: time.EventInstance<T>
        ): void {
            this.scheduleAbsolute(
                new ScheduledEvent(moment.getTime(), eventInstance)
            )
        }

        scheduleFromNow<T extends file.jsonable | void>(
            timeFromNow: game_seconds,
            eventInstance: time.EventInstance<T>
        ): void {
            this.scheduleAbsolute(
                new ScheduledEvent(this.getTime() + timeFromNow, eventInstance)
            )
        }

        private scheduleAbsolute(event: ScheduledEvent) {
            if (event.time < this.getTime()) {
                throw new Error(
                    "Cannot schedule event in the past: " +
                        event.instance.spec.id +
                        " at " +
                        event.time +
                        " (current time " +
                        this.getTime() +
                        ")"
                )
            }
            for (let i = 0; i < this.upcomingEvents.length; i++) {
                if (event.time < this.upcomingEvents[i].time) {
                    this.upcomingEvents.splice(i, 0, event)
                    return
                }
            }
            this.upcomingEvents.push(event)
        }
    }

    export interface TimeNotified {
        /**
         * @param delta number of seconds passed (in game time) since last frame
         */
        notifyTimeAdvance(delta: game_seconds): void
    }

    export namespace instanceOf {
        export function TimeNotified(obj: any): obj is TimeNotified {
            return typeof obj.notifyTimeAdvance === "function"
        }
    }
}
