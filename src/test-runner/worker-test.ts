namespace splitTime.testRunner {
    declare function postMessage(message: unknown): void

    defer(() => {
        const tests = splitTime.test.getScenarios()
        const testHelper = new ExceptionTestHelper()
        function runTest(index: int): TestResult {
            try {
                tests[index].definition(testHelper)
                return new TestResult(index, true)
            } catch(e) {
                if (e instanceof Error) {
                    return new TestResult(index, false, e.message)
                }
                return new TestResult(index, false, JSON.stringify(e))
            }
        }
    
        // If we run in a WebWorker, add some message handlers
        if(__WORKER__) {
            onmessage = function(message) {
                for(const i of message.data) {
                    const result = runTest(i)
                    postMessage(result)
                }
            }
        }
    })
}