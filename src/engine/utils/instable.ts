import * as splitTime from "../splitTime";
/**
 * inst()-able
 */
export interface Instable<T> {
    inst(): T;
}
export function instanceOfInstable(thing: unknown): thing is splitTime.Instable<unknown> {
    const instable = thing as splitTime.Instable<unknown>;
    return !!thing && typeof instable.inst === "function";
}
