namespace splitTime.conversation {
    export class RunnerHelper {
        constructor(
            public readonly secretary: Secretary,
            public readonly playerBodyGetter: () => Body | null
        ) {
        }
    }
}
