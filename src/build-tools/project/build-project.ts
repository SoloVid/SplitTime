import { task } from "../common/task"
import { compileTypescript } from "./compile-typescript"
import { concatEntireGameJs, concatProjectSource } from "./concat-mapped"
import { generateProjectJson } from "./generate-project-json"
import { syncAssets } from "./sync-assets"

export async function buildProject(projectPath: string): Promise<void> {
    const compile = task("compileTypescript", () => compileTypescript(projectPath))
    const projectJson = task("generateProjectJson", () => generateProjectJson(projectPath))
    const projectSource = task("concatProjectSource", () => concatProjectSource(projectPath),
        compile
    )
    const gameJs = task(
        "concatEntireGameJs",
        () => concatEntireGameJs(projectPath),
        projectJson,
        projectSource
    )
    const sync = task("syncAssets", () => syncAssets(projectPath))
    await task("buildProject", () => Promise.all([
        compile,
        projectJson,
        projectSource,
        gameJs,
        sync,
    ]))
    // FTODO: Add minification step for project
}
