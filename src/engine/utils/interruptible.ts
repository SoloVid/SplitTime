export interface Interruptible {
    interrupt(): void;
}
export function instanceOfInterruptible(obj: unknown): obj is Interruptible {
    return !!obj && typeof obj === "object" && typeof (obj as Interruptible).interrupt === "function";
}
