import { TestHelper } from "./test-helper"

export class ExceptionTestHelper implements TestHelper {
    assert(expression: boolean, message: string): void {
        if(!expression) {
            throw new Error(message)
        }
    }

    assertEqual<T>(expected: T, actual: T, message: string): void {
        if(expected !== actual) {
            throw new Error(message + "\n\tExpected: |" + JSON.stringify(expected) + "|\n\tActual:   |" + JSON.stringify(actual) + "|\n")
        }
    }

    assertThrow(callback: () => void, message: string): void {
        let exceptionThrown = false
        try {
            callback()
        } catch (e: unknown) {
            exceptionThrown = true
        }
        this.assert(exceptionThrown, message)
    }
}
