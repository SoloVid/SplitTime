namespace SplitTime.testRunner {
    export type TestFunction = (t: TestHelper) => void
    export type GroupId = object

    export class TestDef {
        constructor(
            public readonly description: string,
            public readonly definition: TestFunction,
            public readonly parentId: GroupId | null
        ) {}
    }

    export class GroupDef {
        constructor(
            public readonly id: GroupId,
            public readonly parentId: GroupId | null,
            public readonly description: string
        ) {}
    }

    export class TestCollection {
        private scenarios: TestDef[] = []
        private groups: GroupDef[] = []

        scenario(parent: GroupId | null, description: string, definition: TestFunction): void {
            this.scenarios.push(new TestDef(description, definition, parent))
        }

        group(id: GroupId, description: string, parent: GroupId | null = null): void {
            this.groups.push(new GroupDef(id, parent, description))
        }

        getScenarios(): readonly TestNode[] {
            return this.scenarios.map((def, i) => new TestNode(i, def.description, def.definition))
        }

        getTree(): TestTree {
            return new TestTree(this.groups, this.scenarios)
        }
    }
}

namespace SplitTime {
    export const test = new testRunner.TestCollection()
}