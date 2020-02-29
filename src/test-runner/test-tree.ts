namespace SplitTime.testRunner {
    export type Node = GroupNode | TestNode

    export class GroupNode {
        public children: Node[] = []
        constructor(
            public readonly id: GroupId,
            public readonly description: string
        ) {}

        getStatus(): int {
            return this.children.reduce(function(max, child) {
                return Math.max(max, child.getStatus())
            }, TestStatus.UNKNOWN)
        }
    }

    export class TestNode {
        public status: int = TestStatus.NONE
        public message: string | null = null
        constructor(
            public readonly id: int,
            public readonly description: string,
            public readonly definition: TestFunction
        ) {}

        getStatus(): int {
            return this.status
        }
    }

    export class TestTree {
        public readonly topLevelNodes: Node[]

        constructor(groups: GroupDef[], scenarios: TestDef[]) {
            this.topLevelNodes = []
            const groupNodes: GroupNode[] = []
            for(const group of groups) {
                groupNodes.push(new GroupNode(group.id, group.description))
            }
            const findGroup = (id: GroupId) => {
                const existingGroup = groupNodes.find(node => node.id === id)
                if(existingGroup) {
                    return existingGroup
                }
                const newGroup = new GroupNode(id, "Group #" + groupNodes.length)
                groupNodes.push(newGroup)
                this.topLevelNodes.push(newGroup)
                return newGroup
            }
            for(const group of groups) {
                if(group.parentId) {
                    findGroup(group.parentId).children.push(findGroup(group.id))
                } else {
                    this.topLevelNodes.push(findGroup(group.id))
                }
            }
            scenarios.forEach((scenario, i) => {
                const node = new TestNode(i, scenario.description, scenario.definition)
                if(scenario.parentId) {
                    findGroup(scenario.parentId).children.push(node)
                } else {
                    this.topLevelNodes.push(node)
                }
            })
        }
    }
}