namespace splitTime {
    export interface Thenable<T> {
        then(arg: T): void
    }

    export namespace instanceOf {
        export function Thenable<T>(obj: unknown): obj is Thenable<T> {
            const objWithThen = obj as { then: undefined | Function }
            return !!obj && typeof obj === "object" && !!obj && typeof objWithThen.then === "function"
        }
    }
}