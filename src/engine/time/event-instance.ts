namespace splitTime.time {
    export class EventInstance<T = void> {
        constructor(
            public readonly spec: EventSpec<T>,
            private readonly argument: file.IsJsonableOrVoid<T>
        ) {}

        run(): ObjectCallbacks<void> {
            const result = this.spec.callback(this.argument)
            if (result && typeof result.register === "function") {
                return result
            }
            return new ObjectCallbacks()
        }
    }
}

namespace splitTime {
    export function instanceOfEventInstance<T>(thing: unknown): thing is time.EventInstance<T> {
        const eventInst = thing as time.EventInstance<T>
        return !!thing && typeof eventInst.run === "function"
    }
}
