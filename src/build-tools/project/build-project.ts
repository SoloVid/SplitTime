import { join } from "../common/file-helper"
import { task } from "../common/task"
import { compileTypescript } from "./compile-typescript"
import { concatEntireGameJs, concatProjectSource } from "./concat-mapped"
import { runEsbuild } from "./esbuild"
import { everythingEntryPointFile, generateImportEverything } from "./generate-import-everything"
import { generateProjectJson } from "./generate-project-json"
// import { minifyGame } from "./minify"
import { syncAssets } from "./sync-assets"
import { tsconfigLocation, writeTsconfig } from "./tsconfig"

export const buildOutputFile = "dist/game.js"

export async function buildProject(projectPath: string): Promise<void> {
    await task("buildProject", () => buildProjectDependent(projectPath))
}

export async function buildProjectDependent(
    projectPath: string,
    typesAvailable: PromiseLike<void> = Promise.resolve(),
    engineJsAvailable: PromiseLike<void> = Promise.resolve()
): Promise<void> {
    const projectJson = task("generateProjectJson", () => generateProjectJson(projectPath))
    const generateEntryPoint = task("generateEntryPoint", () => generateImportEverything(projectPath))
    const tsconfig = task("tsconfig", () => writeTsconfig(projectPath))
    const compile = task("esbuild", () => runEsbuild(
        join(projectPath, everythingEntryPointFile),
        join(projectPath, tsconfigLocation),
        join(projectPath, buildOutputFile)
    ), engineJsAvailable, projectJson, generateEntryPoint, tsconfig)
    // const projectSource = task("concatProjectSource", () => concatProjectSource(projectPath),
    //     compile
    // )
    // const gameJs = task(
    //     "concatEntireGameJs",
    //     () => concatEntireGameJs(projectPath),
    //     engineJsAvailable,
    //     projectJson,
    //     projectSource
    // )
    // FTODO: Add minification step for project
    // const minified = task(
    //     "minify",
    //     () => minifyGame(projectPath),
    //     gameJs
    // )
    const sync = task("syncAssets", () => syncAssets(projectPath))
    await Promise.all([
        tsconfig,
        compile,
        projectJson,
        // projectSource,
        // gameJs,
        // minified,
        sync,
    ])
}
