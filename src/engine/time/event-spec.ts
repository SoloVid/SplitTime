namespace splitTime.time {
    export class EventSpec<T = void> {
        constructor(
            public readonly id: string,
            public readonly callback: (param: file.IsJsonableOrVoid<T>) => (void | ObjectCallbacks<void>)
        ) {}

        inst(argument: file.IsJsonableOrVoid<T>): EventInstance<T> {
            return new EventInstance(this, argument)
        }
    }
}
