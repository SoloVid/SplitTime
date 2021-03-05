import { runAfter } from "../common/concat-mapped"
import { compileTypescript } from "./compile-typescript"
import { concatEntireGameJs, concatProjectSource } from "./concat-mapped"
import { generateProjectJson } from "./generate-project-json"
import { syncAssets } from "./sync-assets"

export async function buildProject(projectPath: string): Promise<void> {
    const compile = runAfter(() => compileTypescript(projectPath))
    const projectJson = runAfter(() => generateProjectJson(projectPath))
    const projectSource = runAfter(() => concatProjectSource(projectPath), compile)
    const gameJs = runAfter(
        () => concatEntireGameJs(projectPath),
        projectJson,
        projectSource
    )
    const sync = runAfter(() => syncAssets(projectPath))
    await Promise.all([
        compile,
        projectJson,
        projectSource,
        gameJs,
        sync,
    ])
    // FTODO: Add minification step for project
}
