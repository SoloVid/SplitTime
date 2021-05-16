import { task } from "../common/task"
import { buildProjectDependent } from "../project/build-project"
import { concatEngineSource } from "./concat-mapped"
import { generateDeclarations } from "./generate-declarations"

export async function buildEngine(projectPath?: string): Promise<void> {
    const declarations = generateDeclarations()
    const engineJs = concatEngineSource()

    const engine = task("buildEngine", () => Promise.all([
        declarations,
        engineJs,
    ]))

    let project = Promise.resolve()
    if (projectPath) {
        project = task("buildProjectDependent", () => buildProjectDependent(projectPath, declarations, engineJs))
    }

    await Promise.all([
        engine,
        project
    ])
}
