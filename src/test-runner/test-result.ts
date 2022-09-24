export class TestResult {
    constructor(
        public readonly testId: string,
        public readonly isSuccess: boolean,
        public readonly message?: string
    ) {}
}
