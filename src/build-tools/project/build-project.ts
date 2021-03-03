import { runAfter } from "../common/concat-mapped"
import { concatEntireGameJs, concatProjectSource } from "./concat-mapped"
import { generateProjectJson } from "./generate-project-json"
import { syncAssets } from "./sync-assets"

export async function buildProject(projectPath: string): Promise<void> {
    const projectJson = runAfter(() => generateProjectJson(projectPath))
    const projectSource = runAfter(() => concatProjectSource(projectPath))
    const gameJs = runAfter(
        () => concatEntireGameJs(projectPath),
        projectJson,
        projectSource
    )
    const sync = runAfter(() => syncAssets(projectPath))
    await Promise.all([
        projectJson,
        projectSource,
        gameJs,
        sync,
    ])
    // FTODO: Add minification step for project
}
