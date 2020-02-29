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
