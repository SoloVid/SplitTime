namespace SplitTime {
    export type game_seconds = number;
    export type game_ms = int;
    export type real_seconds = number;
    export type real_ms = number;

    function toMs(seconds: number): int {
        return Math.floor(seconds * 1000);
    }

    function toSeconds(ms: number): number {
        return ms / 1000;
    }

    class EventInstance {
        public readonly timeMs: game_ms;
        constructor(
            public readonly time: game_seconds,
            public readonly spec: time.EventSpec,
            public readonly argument?: file.jsonable
        ) {
            this.timeMs = toMs(this.time);
        }
    }

    export class Timeline {
        _timeInMilliseconds: game_ms;
        _timeAdvanceListeners: SLVD.RegisterCallbacks;
        _regions: SplitTime.Region[];

        private upcomingEvents: EventInstance[] = [];

        kSecondsPerRealSecond: game_seconds;
        kSecondsPerMinute = 60;
        kMinutesPerHour = 60;
        kHoursPerDay = 24;

        constructor() {
            this._timeInMilliseconds = 0;
            this._timeAdvanceListeners = new SLVD.RegisterCallbacks();
            /**
            * @type {SplitTime.Region[]}
            */
            this._regions = [];
            
            this.kSecondsPerRealSecond = 1;
        };
        
        registerTimeAdvanceListener(listener: (delta: game_seconds) => any) {
            this._timeAdvanceListeners.register(listener);
        };
        
        addRegion(region: SplitTime.Region) {
            this._regions.push(region);
        };
        removeRegion(region: SplitTime.Region) {
            var regionIndex = this._regions.indexOf(region);
            if(regionIndex >= 0) {
                this._regions.splice(regionIndex, 1);
            } else if(SplitTime.debug.ENABLED) {
                SplitTime.Logger.warn("Attempted to remove region " + region.id + " from non-parent timeline");
            }
        };
        
        getTimeMs(): game_ms {
            return this._timeInMilliseconds;
        };

        getTime(): game_seconds {
            return toSeconds(this.getTimeMs());
        };
        
        advance(seconds: game_seconds) {
            const newTimeMs = this._timeInMilliseconds + toMs(seconds);

            // Run scheduled events
            while(this.upcomingEvents.length > 0 && this.upcomingEvents[0].timeMs <= newTimeMs) {
                const event = this.upcomingEvents.shift() as EventInstance;
                // Update time along the way in case someone cares
                this._timeInMilliseconds = event.timeMs;
                event.spec.callback(event.argument);
            }

            // Move time fully ahead
            this._timeInMilliseconds = newTimeMs;

            // Notify listeners
            this._timeAdvanceListeners.run(seconds);
            for(var i = 0; i < this._regions.length; i++) {
                this._regions[i].notifyTimeAdvance(seconds);
            }
        };
        
        notifyFrameUpdate(delta: real_seconds) {
            this.advance(delta * this.kSecondsPerRealSecond);
        };

        second(seconds: number): game_seconds {
            return seconds;
        }

        minute(minutes: number): game_seconds {
            return minutes * this.second(this.kSecondsPerMinute);
        }

        hour(hours: number): game_seconds {
            return hours * this.minute(this.kMinutesPerHour);
        }

        day(days: number): game_seconds {
            return days * this.hour(this.kHoursPerDay);
        }

        schedule(moment: time.Moment, spec: time.EventSpec, argument?: file.jsonable): void {
            this.scheduleAbsolute(new EventInstance(moment.getTime(), spec, argument));
        }

        scheduleFromNow(timeFromNow: game_seconds, spec: time.EventSpec, argument?: file.jsonable): void {
            this.scheduleAbsolute(new EventInstance(this.getTime() + timeFromNow, spec, argument));
        }

        private scheduleAbsolute(event: EventInstance) {
            if(event.time < this.getTime()) {
                throw new Error("Cannot schedule event in the past: " + event.spec.id + " at " + event.time + " (current time " + this.getTime() + ")");
            }
            for(let i = 0; i < this.upcomingEvents.length; i++) {
                if(event.time < this.upcomingEvents[i].time) {
                    this.upcomingEvents.splice(i, 0, event);
                    return;
                }
            }
            this.upcomingEvents.push(event);
        }
    }

    export interface TimeNotified {
        /**
        * @param delta number of seconds passed (in game time) since last frame
        */
        notifyTimeAdvance(delta: game_seconds): void;
    }

    export namespace instanceOf {
        export function TimeNotified(obj: any): obj is TimeNotified {
            return typeof obj.notifyTimeAdvance === "function";
        }
    }    
}
