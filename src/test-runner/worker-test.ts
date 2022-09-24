import { __WORKER__ } from "../environment"
import { ExceptionTestHelper } from "./exception-test-helper"
import { GroupDef } from "./test"
import { TestResult } from "./test-result"

declare function postMessage(message: unknown): void

export function runWorkerSetup(group: GroupDef) {
    if (!__WORKER__) {
        throw new Error("Not in worker context")
    }

    const tests = group.getAllScenarios()
    const testHelper = new ExceptionTestHelper()
    function runTest(id: string): TestResult {
        const testById = tests.filter(t => t.id === id)
        if (testById.length !== 1) {
            return new TestResult(id, false, `Found ${testById.length} tests for ID ${id}`)
        }
        try {
            testById[0].definition(testHelper)
            return new TestResult(id, true)
        } catch(e) {
            if (e instanceof Error) {
                return new TestResult(id, false, e.message)
            }
            return new TestResult(id, false, JSON.stringify(e))
        }
    }

    // Add message handler
    onmessage = function(message) {
        for(const id of message.data) {
            const result = runTest(id)
            postMessage(result)
        }
    }
}