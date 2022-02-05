import { EventSpec } from "./event-spec";
import { IsJsonableOrVoid } from "../file/json";
import { ObjectCallbacks, time } from "../splitTime";
export class EventInstance<T = void> {
    constructor(public readonly spec: EventSpec<T>, private readonly argument: IsJsonableOrVoid<T>) { }
    run(): ObjectCallbacks<void> {
        const result = this.spec.callback(this.argument);
        if (result && typeof result.register === "function") {
            return result;
        }
        return new ObjectCallbacks();
    }
}
export function instanceOfEventInstance<T>(thing: unknown): thing is time.EventInstance<T> {
    const eventInst = thing as time.EventInstance<T>;
    return !!thing && typeof eventInst.run === "function";
}
