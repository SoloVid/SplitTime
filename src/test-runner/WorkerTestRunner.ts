namespace SplitTime.testRunner {
    export class WorkerTestRunner {
        private readonly worker: Worker
        private readonly topLevelNode: GroupNode | TestNode

        constructor(scriptPath: string, node: GroupNode | TestNode) {
            this.worker = new Worker(scriptPath)
            this.topLevelNode = node

            this.worker.onmessage = message => {
                const data = message.data as TestResult
                console.log(data)
                const test = this.findTestById(data.testId, this.topLevelNode)!
                test.status = data.isSuccess ? TestStatus.SUCCESS : TestStatus.FAIL
                test.message = data.message
            }
        }

        launch(): void {
            var ids = this.gatherTestIds(this.topLevelNode)
            this.worker.postMessage(ids)
        }

        kill(): void {
            this.worker.terminate()
            this.forEachTest(this.topLevelNode, test => {
                if(test.status === TestStatus.RUNNING) {
                    test.status = TestStatus.NONE
                }
            })
        }

        private findTestById(id: int, node: Node): TestNode | null {
            let matchedTest = null
            this.forEachTest(node, test => {
                if(test.id === id) {
                    matchedTest = test
                }
            })
            return matchedTest
            // if(node instanceof GroupNode) {
            //     for(const child of node.children) {
            //         const childResult = this.findTestById(id, child)
            //         if(childResult) {
            //             return childResult
            //         }
            //     }
            // } else {
            //     if(node.id === id) {
            //         return node
            //     }
            // }
            // return null
        }

        private gatherTestIds(node: Node): int[] {
            var ids: int[] = []
            this.forEachTest(node, test => ids.push(test.id))
            // if(node instanceof GroupNode) {
            //     for(var i = 0; i < node.children.length; i++) {
            //         ids = ids.concat(this.gatherTestIds(node.children[i]))
            //     }
            // } else {
            //     ids.push(node.id)
            // }
            return ids
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