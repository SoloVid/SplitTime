namespace splitTime.time {
    export class EventSpec<T extends file.jsonable | void = void> {
        constructor(
            public readonly id: string,
            public readonly callback: (param: T) => (void | ObjectCallbacks<void>)
        ) {}

        inst(argument: T): EventInstance<T> {
            return new EventInstance(this, argument)
        }
    }
}
