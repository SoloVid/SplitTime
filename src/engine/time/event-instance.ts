namespace splitTime.time {
    export class EventInstance<T extends file.jsonable | void> {
        constructor(
            public readonly spec: EventSpec<T>,
            private readonly argument: T
        ) {}

        run(): ObjectCallbacks<void> {
            const result = this.spec.callback(this.argument)
            if (result && typeof result.register === "function") {
                return result
            }
            return new ObjectCallbacks();
        }
    }
}

namespace splitTime.instanceOf {
    export function EventInstance<T extends file.jsonable | void>(thing: unknown): thing is time.EventInstance<T> {
        const eventInst = thing as time.EventInstance<T>
        return !!thing && typeof eventInst.run === "function";
    }
}
