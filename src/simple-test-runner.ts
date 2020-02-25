namespace SplitTime {
    class SimpleTestHelper implements SplitTime.TestHelper {
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
    }

    export class ConsoleTestRunner {
        // FTODO: maybe clean up; not sure these log statements would look right in browser
        private redError(message: string) {
            console.error('\x1b[31m%s\x1b[0m', message)
        }

        private greenInfo(message: string) {
            console.info('\x1b[32m%s\x1b[0m', message)
        }

        run(): void {
            console.info("Running tests in console...");
            const testHelper = new SimpleTestHelper()
            const scenarios = SplitTime.test.tree()
            let passedCount = 0
            for(const testDef of scenarios) {
                try {
                    testDef.definition(testHelper)
                    passedCount++
                } catch(e) {
                    this.redError("FAIL: " + testDef.description)
                    console.error(e)
                }
            }
            if(passedCount < scenarios.length) {
                this.redError(passedCount + "/" + scenarios.length + " tests passed")
                if(__NODE__) {
                    process.exit(1)
                } else {
                    throw new Error("Test run failed")
                }
            } else {
                this.greenInfo(passedCount + "/" + scenarios.length + " tests passed")
            }
        }
    }
}
