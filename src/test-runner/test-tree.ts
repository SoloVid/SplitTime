import { GroupId, TestFunction } from "./test"
import { TestStatus, TestStatusType } from "./test-status"

export type Node = GroupNode | TestNode

export class GroupNode {
    public children: Node[] = []
    constructor(
        public readonly id: GroupId,
        public readonly description: string
    ) {}

    getStatus(): TestStatusType {
        return this.children.reduce((max: TestStatusType, child) => {
            return Math.max(max, child.getStatus()) as TestStatusType
        }, TestStatus.UNKNOWN)
    }
}

export class TestNode {
    public status: TestStatusType = TestStatus.NONE
    public message: string | null = null
    constructor(
        public readonly id: string,
        public readonly description: string,
        public readonly definition: TestFunction
    ) {}

    getStatus(): TestStatusType {
        return this.status
    }
}
