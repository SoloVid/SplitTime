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

    class TimelineRelation {
        constructor(
            public readonly otherTimeline: Timeline,
            public readonly otherSecondsPerMySecond: number
        ) {}
    }

    export class Timeline {
        private time: game_seconds = Number.NEGATIVE_INFINITY
        private timeAdvanceListeners: splitTime.RegisterCallbacks = new splitTime.RegisterCallbacks()
        private regions: splitTime.Region[] = []

        private upcomingEvents: ScheduledEvent[] = []

        readonly beginning: time.Moment = new time.Moment(0)
        kSecondsPerRealSecond: game_seconds = 1
        kSecondsPerMinute: number = 60
        kMinutesPerHour: number = 60
        kHoursPerDay: number = 24

        private readonly timelineRelations: TimelineRelation[] = []
        // This is our variable for preventing infinite recursion on navigating two-way relations
        private isAlreadyVisited: boolean = false

        constructor(public readonly id: string) {}

        registerTimeAdvanceListener(listener: (delta: game_seconds) => any): void {
            this.timeAdvanceListeners.register(listener)
        }

        addRegion(region: splitTime.Region): void {
            this.regions.push(region)
        }
        removeRegion(region: splitTime.Region): void {
            var regionIndex = this.regions.indexOf(region)
            if (regionIndex >= 0) {
                this.regions.splice(regionIndex, 1)
            } else if (splitTime.debug.ENABLED) {
                splitTime.log.warn(
                    "Attempted to remove region " +
                        region.id +
                        " from non-parent timeline"
                )
            }
        }

        /**
         * Relate two timelines such that they advance together.
         * The timelines can have different rates of advancing.
         * @param otherTimeline timeline to relate (two-way)
         * @param otherSecondsPerMySecond ratio of advance rates (e.g. 2 means other timeline moves half as fast as this one)
         */
        relateTimeline(otherTimeline: Timeline, otherSecondsPerMySecond: number = 1): void {
            this.timelineRelations.push(new TimelineRelation(otherTimeline, otherSecondsPerMySecond))
            otherTimeline.timelineRelations.push(new TimelineRelation(this, 1 / otherSecondsPerMySecond))
        }

        getTimeMs(): game_ms {
            return toMs(this.time)
        }

        getTime(): game_seconds {
            return this.time
        }

        getTimeOfDay(): game_seconds {
            return this.getTime() % this.day()
        }

        getTimeOfDayString(): string {
            const timeOfDay = this.getTimeOfDay()
            const hour = Math.floor(timeOfDay / this.hour())
            const minute = Math.floor((timeOfDay % this.hour()) / this.minute())
            return pad(hour, 2) + ":" + pad(minute, 2)
        }

        /**
         * This method is only really intended to be called for initializing/resetting timelines
         * @param seconds 
         * @param includeRelated 
         */
        setTime(seconds: game_seconds): void {
            this.time = seconds
        }

        advance(seconds: game_seconds, includeRelated: boolean = true): void {
            if (this.isAlreadyVisited) {
                return
            }

            const beginning = this.beginning.getTime()
            if (this.time < beginning) {
                this.time = beginning
            }

            const newTime = this.time + seconds

            // Run scheduled events
            while (
                this.upcomingEvents.length > 0 &&
                this.upcomingEvents[0].time <= newTime
            ) {
                const event = this.upcomingEvents.shift() as ScheduledEvent
                // Update time along the way in case someone cares
                this.time = event.time
                event.instance.run()
            }

            // Move time fully ahead
            this.time = newTime

            // Notify listeners
            this.timeAdvanceListeners.run(seconds)
            for (const region of this.regions) {
                region.notifyTimeAdvance(seconds, newTime)
            }

            if(includeRelated) {
                try {
                    this.isAlreadyVisited = true
                    for (const timelineRelation of this.timelineRelations) {
                        timelineRelation.otherTimeline.advance(seconds * timelineRelation.otherSecondsPerMySecond, true)
                    }
                } finally {
                    this.isAlreadyVisited = false
                }
            }
        }

        notifyFrameUpdate(delta: real_seconds) {
            this.advance(delta * this.kSecondsPerRealSecond)
        }

        second(seconds: number = 1): game_seconds {
            return seconds
        }

        minute(minutes: number = 1): game_seconds {
            return minutes * this.second(this.kSecondsPerMinute)
        }

        hour(hours: number = 1): game_seconds {
            return hours * this.minute(this.kMinutesPerHour)
        }

        day(days: number = 1): game_seconds {
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
