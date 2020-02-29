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
            // const topLevelNodes: Node[] = []
            // const groupNodes: GroupNode[] = []
            // for(const group of this.groups) {
            //     groupNodes.push(new GroupNode(group.id, group.description))
            // }
            // const findGroup = (id: GroupId) => {
            //     const existingGroup = groupNodes.find(node => node.id === id)
            //     if(existingGroup) {
            //         return existingGroup
            //     }
            //     const newGroup = new GroupNode(id, "Group #" + groupNodes.length)
            //     groupNodes.push(newGroup)
            //     topLevelNodes.push(newGroup)
            //     return newGroup
            // }
            // for(const group of this.groups) {
            //     if(group.parentId) {
            //         findGroup(group.parentId).children.push(findGroup(group.id))
            //     } else {
            //         topLevelNodes.push(findGroup(group.id))
            //     }
            // }
            // this.scenarios.forEach((scenario, i) => {
            //     const node = new TestNode(i, scenario.description, scenario.definition)
            //     if(scenario.parentId) {
            //         findGroup(scenario.parentId).children.push(node)
            //     } else {
            //         topLevelNodes.push(node)
            //     }
            // })
            // return topLevelNodes
        }
    }
}

namespace SplitTime {
    export const test = new testRunner.TestCollection()
}