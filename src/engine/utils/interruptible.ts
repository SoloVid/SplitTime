namespace splitTime {
    export interface Interruptible {
        interrupt(): void
    }
}
namespace splitTime {
    export function instanceOfInterruptible(obj: unknown): obj is Interruptible {
        return !!obj && typeof obj === "object" && typeof (obj as Interruptible).interrupt === "function"
    }
}
