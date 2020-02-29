namespace splitTime {
    export interface Thenable<T> {
        then(arg: T): void
    }

    export namespace instanceOf {
        export function Thenable<T>(obj: any): obj is Thenable<T> {
            return typeof obj === "object" && typeof obj.then === "function"
        }
    }
}