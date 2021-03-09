import { task } from "../common/task"
import { compileTypescript } from "./compile-typescript"
import { concatEntireGameJs, concatProjectSource } from "./concat-mapped"
import { generateProjectJson } from "./generate-project-json"
// import { minifyGame } from "./minify"
import { syncAssets } from "./sync-assets"

export async function buildProject(projectPath: string): Promise<void> {
    await task("buildProject", () => buildProjectBody(projectPath))
}

async function buildProjectBody(projectPath: string): Promise<void> {
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
    // FTODO: Add minification step for project
    // const minified = task(
    //     "minify",
    //     () => minifyGame(projectPath),
    //     gameJs
    // )
    const sync = task("syncAssets", () => syncAssets(projectPath))
    await Promise.all([
        compile,
        projectJson,
        projectSource,
        gameJs,
        // minified,
        sync,
    ])
}
