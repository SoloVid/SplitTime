namespace splitTime {
    // Note: TypeScript can't enforce integers; so tread with caution
    export type int = number

    export function assert(condition: boolean, message: string): asserts condition {
        if(!condition) {
            throw new Error(message)
        }
    }

    export function assertNever(impossible: never, message: string): never {
        throw new Error(message)
    }
}
