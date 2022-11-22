import { ObjectCallbacks } from "engine/utils/object-callbacks";
import { IsJsonableOrVoid } from "../file/json";
import { EventInstance } from "./event-instance";

export class EventSpec<T = void> {
    constructor(public readonly id: string, public readonly callback: (param: IsJsonableOrVoid<T>) => (void | ObjectCallbacks<void>)) { }
    inst(argument: IsJsonableOrVoid<T>): EventInstance<T> {
        return new EventInstance(this, argument);
    }
}
