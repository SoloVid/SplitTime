namespace splitTime.testRunner {
    export class TestResult {
        constructor(
            public readonly testId: int,
            public readonly isSuccess: boolean,
            public readonly message?: string
        ) {}
    }
}