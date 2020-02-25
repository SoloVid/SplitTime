namespace SplitTime {
    type TestFunction = (t: TestHelper) => void

    export interface TestHelper {
        assert(expression: boolean, message: string): void
        assertEqual<T>(expected: T, actual: T, message: string): void
        // FTODO: maybe add more assertions or logging mechanisms
    }

    export class TestDef {
        constructor(
            public readonly description: string,
            public readonly definition: TestFunction
        ) {}
    }

    class GroupId {}

    class TestCollection {
        private scenarios: TestDef[] = []

        scenario(parent: GroupId | null, description: string, definition: TestFunction): void {
            this.scenarios.push(new TestDef(description, definition))
        }

        group(parent: GroupId | null, description: string): void {
            // TODO: Figure out how to implement groups in this paradigm
            // May have to resort to strings for group identification
        }

        // TODO: Actually make this a tree
        tree(): readonly TestDef[] {
            return this.scenarios
        }
    }

    export const test = new TestCollection()
}