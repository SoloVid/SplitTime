namespace splitTime {
    export interface Interruptible {
        interrupt(): void
    }

    export namespace instanceOf {
        export function Interruptible(obj: any): obj is Interruptible {
            return typeof obj === "object" && typeof obj.interrupt === "function"
        }
    }
}