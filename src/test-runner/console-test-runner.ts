namespace splitTime.testRunner {
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
            const testHelper = new ExceptionTestHelper()
            const scenarios = splitTime.test.getScenarios()
            let passedCount = 0
            for(const testDef of scenarios) {
                try {
                    testDef.definition(testHelper)
                    passedCount++
                } catch(e: unknown) {
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
