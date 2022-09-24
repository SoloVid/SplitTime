import { test } from "under-the-sun"
import { __NODE__ } from "../environment"
import { ExceptionTestHelper } from "./exception-test-helper"
import { TestHelper } from "./test-helper"

export type TestFunction = (t: TestHelper) => void

export class TestDef {
    constructor(
        public readonly description: string,
        public readonly definition: TestFunction,
    ) {}
}

export type GlobalTestDef = {
    id: string,
    definition: TestFunction,
}

export class GroupDef {
    private scenarios: TestDef[] = []
    private groups: GroupDef[] = []

    constructor(
        public readonly description: string,
        public readonly ancestorsDescriptionPrefix: string = "",
    ) {}

    scenario(description: string, definition: TestFunction): void {
        this.scenarios.push(new TestDef(description, definition))

        if (__NODE__) {
            console.log("setting up UTS test for " + description)
            test(this.ancestorsDescriptionPrefix + description, () => definition(new ExceptionTestHelper()))
        } else {
            console.log("NOT setting up UTS test for " + description)
        }
    }

    group(description: string): GroupDef {
        const group = new GroupDef(description, `${this.ancestorsDescriptionPrefix}${this.description} > `)
        this.groups.push(group)
        return group
    }

    getAllScenarios(): readonly GlobalTestDef[] {
        return [
            ...this.scenarios.map(s => ({ id: `${this.ancestorsDescriptionPrefix}${this.description} > ${s.description}`, definition: s.definition })),
            ...this.groups.reduce((soFar, g) => {
                const result: GlobalTestDef[] = [...soFar, ...g.getAllScenarios()]
                return result
            }, [] as GlobalTestDef[]),
        ]
    }
}
