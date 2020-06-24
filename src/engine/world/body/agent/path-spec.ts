namespace splitTime.agent {
    export class PathSpec {
        constructor(
            public readonly id: string,
            public readonly setup: SetupFunc
        ) {
        }
    }
}