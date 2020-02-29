namespace SplitTime.testRunner {
    export class WorkerTestRunner {
        private readonly worker: Worker
        private readonly topLevelNode: GroupNode | TestNode
        private readonly promise = new SLVD.Promise()
        private totalTests: int = 0
        private testsCompleted: int = 0

        constructor(id: int, scriptPath: string, node: GroupNode | TestNode) {
            this.worker = new Worker(scriptPath, { name: "(" + id + ") " + node.description })
            this.topLevelNode = node

            this.worker.onmessage = message => {
                const data = message.data as TestResult
                this.handleTestResult(data)
            }
        }

        private handleTestResult(result: TestResult): void {
            const test = this.findTestById(result.testId, this.topLevelNode)!
            test.status = result.isSuccess ? TestStatus.SUCCESS : TestStatus.FAIL
            test.message = result.message || null
            this.testsCompleted++
            if(this.testsCompleted >= this.totalTests) {
                this.promise.resolve()
            }
        }

        launch(): PromiseLike<void> {
            let ids: int[] = []
            this.forEachTest(this.topLevelNode, test => {
                this.totalTests++
                test.status = TestStatus.RUNNING
                ids.push(test.id)
            })
            this.worker.postMessage(ids)
            return this.promise
        }

        kill(): void {
            this.worker.terminate()
            this.forEachTest(this.topLevelNode, test => {
                if(test.status === TestStatus.RUNNING) {
                    test.status = TestStatus.NONE
                }
            })
            if(!this.promise.resolved) {
                this.promise.resolve()
            }
        }

        private findTestById(id: int, node: Node): TestNode | null {
            let matchedTest = null
            this.forEachTest(node, test => {
                if(test.id === id) {
                    matchedTest = test
                }
            })
            return matchedTest
        }

        private forEachTest(node: Node, callback: (testNode: TestNode) => void): void {
            if(node instanceof GroupNode) {
                for(const child of node.children) {
                    this.forEachTest(child, callback)
                }
            } else {
                callback(node)
            }
        }
    }
}