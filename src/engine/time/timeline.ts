import { Moment } from "./moment";
import { EventInstance } from "./event-instance";
import { ENABLED } from "../utils/debug";
import { warn } from "../utils/logger";
import { assert } from "globals";
import { pad } from "engine/utils/misc";
import { RegisterCallbacks, CallbackResult } from "engine/utils/register-callbacks";
import { Region } from "engine/world/region";

export type game_seconds = number;
export type real_seconds = number;
interface FixtureEvent {
    moment: Moment;
    event: () => void;
    recurs: game_seconds;
}
class ScheduledEvent<T> {
    // constructor(
    //     time: game_seconds,
    //     instance: (() => void),
    //     recurs: game_seconds
    // )
    // constructor(
    //     time: game_seconds,
    //     instance: time.EventInstance<T>,
    // )
    constructor(public readonly time: game_seconds, public readonly instance: EventInstance<T> | (() => void), public readonly recurs: game_seconds = 0) { }
}
class TimelineRelation {
    constructor(public readonly otherTimeline: Timeline, public readonly otherSecondsPerMySecond: number) { }
}
export class Timeline {
    private time: game_seconds = Number.NEGATIVE_INFINITY;
    private timeAdvanceListeners: RegisterCallbacks = new RegisterCallbacks();
    private regions: Region[] = [];
    private readonly fixtureEvents: FixtureEvent[] = [];
    private upcomingEvents: ScheduledEvent<unknown>[] = [];
    readonly beginning: Moment = new Moment(0, null);
    kSecondsPerRealSecond: game_seconds = 1;
    kSecondsPerMinute: number = 60;
    kMinutesPerHour: number = 60;
    kHoursPerDay: number = 24;
    private readonly timelineRelations: TimelineRelation[] = [];
    // This is our variable for preventing infinite recursion on navigating two-way relations
    private isAlreadyVisited: boolean = false;
    private isStarted: boolean = false;
    constructor(public readonly id: string) { }
    registerTimeAdvanceListener(listener: (delta: game_seconds) => CallbackResult): void {
        this.timeAdvanceListeners.register(listener);
    }
    addRegion(region: Region): void {
        this.regions.push(region);
    }
    removeRegion(region: Region): void {
        var regionIndex = this.regions.indexOf(region);
        if (regionIndex >= 0) {
            this.regions.splice(regionIndex, 1);
        }
        else if (ENABLED) {
            warn("Attempted to remove region " +
                region.id +
                " from non-parent timeline");
        }
    }
    /**
     * Relate two timelines such that they advance together.
     * The timelines can have different rates of advancing.
     * @param otherTimeline timeline to relate (two-way)
     * @param otherSecondsPerMySecond ratio of advance rates (e.g. 2 means other timeline moves half as fast as this one)
     */
    relateTimeline(otherTimeline: Timeline, otherSecondsPerMySecond: number = 1): void {
        this.timelineRelations.push(new TimelineRelation(otherTimeline, otherSecondsPerMySecond));
        otherTimeline.timelineRelations.push(new TimelineRelation(this, 1 / otherSecondsPerMySecond));
    }
    /**
     * Get the current time in seconds.
     */
    getTime(): game_seconds {
        return this.time;
    }
    getTimeOfDay(): game_seconds {
        return this.getTime() % this.day();
    }
    getTimeOfDayString(): string {
        const timeOfDay = this.getTimeOfDay();
        const hour = Math.floor(timeOfDay / this.hour());
        const minute = Math.floor((timeOfDay % this.hour()) / this.minute());
        return pad(hour, 2) + ":" + pad(minute, 2);
    }
    /**
     * This method is only really intended to be called for initializing/resetting timelines
     * @param seconds
     * @param includeRelated
     */
    resetTimeTo(seconds: game_seconds): void {
        this.upcomingEvents = [];
        this.time = seconds;
        for (const fixtureEvent of this.fixtureEvents) {
            const eventTime = fixtureEvent.moment.getTime();
            let scheduleTime = eventTime;
            if (scheduleTime < this.time) {
                const timeSinceLast = (this.time - eventTime) % fixtureEvent.recurs;
                const timeFromNow = fixtureEvent.recurs - timeSinceLast;
                scheduleTime = this.time + timeFromNow;
            }
            this.scheduleAbsolute(new ScheduledEvent(scheduleTime, fixtureEvent.event, fixtureEvent.recurs));
        }
    }
    advance(seconds: game_seconds, includeRelated: boolean = true): void {
        if (this.isAlreadyVisited) {
            return;
        }
        const beginning = this.beginning.getTime();
        if (this.time < beginning) {
            this.time = beginning;
        }
        const newTime = this.time + seconds;
        // Run scheduled events
        while (this.upcomingEvents.length > 0 &&
            this.upcomingEvents[0].time <= newTime) {
            const event = this.upcomingEvents.shift() as ScheduledEvent<unknown>;
            // Update time along the way in case someone cares
            this.time = event.time;
            if (typeof event.instance === "function") {
                event.instance();
                if (event.recurs > 0) {
                    this.scheduleAbsolute(new ScheduledEvent(event.time + event.recurs, event.instance, event.recurs));
                }
            }
            else {
                event.instance.run();
            }
        }
        // Move time fully ahead
        this.time = newTime;
        // Notify listeners
        this.timeAdvanceListeners.run(seconds);
        for (const region of this.regions) {
            region.notifyTimeAdvance(seconds, newTime);
        }
        if (includeRelated) {
            try {
                this.isAlreadyVisited = true;
                for (const timelineRelation of this.timelineRelations) {
                    timelineRelation.otherTimeline.advance(seconds * timelineRelation.otherSecondsPerMySecond, true);
                }
            }
            finally {
                this.isAlreadyVisited = false;
            }
        }
    }
    notifyFrameUpdate(delta: real_seconds) {
        this.isStarted = true;
        this.advance(delta * this.kSecondsPerRealSecond);
    }
    second(seconds: number = 1): game_seconds {
        return seconds;
    }
    minute(minutes: number = 1): game_seconds {
        return minutes * this.second(this.kSecondsPerMinute);
    }
    hour(hours: number = 1): game_seconds {
        return hours * this.minute(this.kMinutesPerHour);
    }
    day(days: number = 1): game_seconds {
        return days * this.hour(this.kHoursPerDay);
    }
    /**
     * Schedule simple event specified by callback.
     * This kind of scheduled event cannot be saved.
     * Scheduling events in this manner must occur before timeline starts.
     */
    schedule(moment: Moment, eventCallback: (() => void)): void;
    /**
     * Schedule event that can be saved/serialized.
     */
    schedule<T>(moment: Moment, eventInstance: EventInstance<T>): void;
    schedule<T>(moment: Moment, event: EventInstance<T> | (() => void)): void {
        if (typeof event === "function") {
            this.scheduleRecurring(moment, event, 0);
        }
        else {
            this.scheduleAbsolute(new ScheduledEvent(moment.getTime(), event));
        }
    }
    /**
     * Schedule simple recurring event specified by callback.
     * This kind of scheduled event cannot be saved.
     * Scheduling events in this manner must occur before timeline starts.
     */
    scheduleRecurring(moment: Moment, event: (() => void), recurs: game_seconds): void {
        assert(!this.isStarted, "Simple callback event cannot be specified after timeline starts");
        this.fixtureEvents.push({ moment, event, recurs });
    }
    scheduleFromNow<T>(timeFromNow: game_seconds, eventInstance: EventInstance<T> | (() => void)): void {
        this.scheduleAbsolute(new ScheduledEvent(this.getTime() + timeFromNow, eventInstance));
    }
    private scheduleAbsolute<T>(event: ScheduledEvent<T>) {
        if (event.time < this.getTime()) {
            const id = (typeof event.instance === "function") ? "callback" : event.instance.spec.id;
            throw new Error("Cannot schedule event in the past: " +
                id +
                " at " +
                event.time +
                " (current time " +
                this.getTime() +
                ")");
        }
        for (let i = 0; i < this.upcomingEvents.length; i++) {
            if (event.time < this.upcomingEvents[i].time) {
                this.upcomingEvents.splice(i, 0, event as ScheduledEvent<unknown>);
                return;
            }
        }
        this.upcomingEvents.push(event as ScheduledEvent<unknown>);
    }
}
export interface TimeNotified {
    /**
     * @param delta number of seconds passed (in game time) since last frame
     */
    notifyTimeAdvance(delta: game_seconds): void;
}
export function instanceOfTimeNotified(obj: unknown): obj is TimeNotified {
    return typeof (obj as TimeNotified).notifyTimeAdvance === "function";
}
