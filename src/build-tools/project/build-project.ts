import { cyanInfo, redError } from "build-tools/common/color-output"
import { join } from "../common/file-helper"
import { task } from "../common/task"
import { AlreadyPrintedError } from "./already-printed-error"
import { compileTypescript } from "./compile-typescript"
import { runEsbuild } from "./esbuild"
import { everythingEntryPointFile, generateImportEverything } from "./generate-import-everything"
import { generateProjectJson } from "./generate-project-json"
import { syncAssets } from "./sync-assets"
import { tsconfigLocation, writeTsconfig } from "./tsconfig"

type Options = {
    projectPath: string,
    checkTypes: boolean,
}

export const buildOutputFile = "dist/game.js"

export async function buildProject(options: Options): Promise<void> {
    const start = performance.now()
    try {
        await buildProjectDependent(options)
        const ms = Math.round(performance.now() - start)
        cyanInfo(`build finished after ${ms} ms`)
    } catch (e) {
        if (!(e instanceof AlreadyPrintedError)) {
            console.error(e)
        }
        redError(`build failed`)
    }
}

export async function buildProjectDependent(
    {
        projectPath,
        checkTypes,
    }: Options,
): Promise<void> {
    const projectJson = task("generate JSON", () => generateProjectJson(projectPath))
    const generateEntryPoint = task("generate TS", () => generateImportEverything(projectPath))
    const tsconfig = task("generate tsconfig.json", () => writeTsconfig(projectPath))
    const checkTypesPromise = checkTypes ?
        task("check types", () => compileTypescript(projectPath),
            projectJson, generateEntryPoint, tsconfig) :
        Promise.resolve()
    const compile = task("build TS", () => runEsbuild(
        join(projectPath, everythingEntryPointFile),
        join(projectPath, tsconfigLocation),
        join(projectPath, buildOutputFile)
    ), projectJson, generateEntryPoint, tsconfig)
    const sync = task("sync assets", () => syncAssets(projectPath))
    await Promise.all([
        tsconfig,
        compile,
        projectJson,
        sync,
        checkTypesPromise,
    ])
}
