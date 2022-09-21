import { IsJsonableOrVoid } from "../file/json";
import { ObjectCallbacks } from "../splitTime";
import { EventInstance } from "./event-instance";
export class EventSpec<T = void> {
    constructor(public readonly id: string, public readonly callback: (param: IsJsonableOrVoid<T>) => (void | ObjectCallbacks<void>)) { }
    inst(argument: IsJsonableOrVoid<T>): EventInstance<T> {
        return new EventInstance(this, argument);
    }
}
