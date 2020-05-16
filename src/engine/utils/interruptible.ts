namespace splitTime {
    export interface Interruptible {
        interrupt(): void
    }

    export namespace instanceOf {
        export function Interruptible(obj: unknown): obj is Interruptible {
            return !!obj && typeof obj === "object" && typeof (obj as Interruptible).interrupt === "function"
        }
    }
}