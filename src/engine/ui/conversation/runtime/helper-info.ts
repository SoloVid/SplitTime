namespace splitTime.conversation {
    export class HelperInfo {
        constructor(
            public readonly playerBodyGetter: () => Body | null,
            public readonly advanceEvent: body.CustomEventHandler<void>
        ) {}
    }
}
