import * as splitTime from "../splitTime";
export interface Interruptible {
    interrupt(): void;
}
export function instanceOfInterruptible(obj: unknown): obj is splitTime.Interruptible {
    return !!obj && typeof obj === "object" && typeof (obj as splitTime.Interruptible).interrupt === "function";
}
