namespace splitTime.testRunner {
    export interface TestHelper {
        assert(expression: boolean, message: string): void
        assertEqual<T>(expected: T, actual: T, message: string): void
        // FTODO: maybe add more assertions or logging mechanisms
    }
}