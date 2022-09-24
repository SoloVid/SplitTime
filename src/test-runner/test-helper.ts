export interface TestHelper {
    assert(expression: boolean, message: string): void
    assertEqual<T>(expected: T, actual: T, message: string): void
    assertThrow(callback: () => void, message: string): void
}
