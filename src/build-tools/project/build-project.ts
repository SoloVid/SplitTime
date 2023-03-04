import { noOp } from "build-tools/common/no-op"
import { randomUUID } from "node:crypto"
import { readdir, rm } from "node:fs/promises"
import { cyanInfo, redError } from "../common/color-output"
import { getErrorString } from "../common/error-helper"
import { join, writeFile } from "../common/file-helper"
import { makeTaskFactory } from "../common/task"
import { AlreadyPrintedError } from "./already-printed-error"
import { generateProjectHtml } from "./build-html"
import { compileTypescript } from "./compile-typescript"
import { buildIdFile, buildLogsDirectory, buildStatusFile, distGameJsFile } from "./constants"
import { runEsbuild } from "./esbuild"
import { everythingEntryPointFile, generateImportEverything } from "./generate-import-everything"
import { generateProjectJson } from "./generate-project-json"
import { status } from "./status"
import { syncAssets } from "./sync-assets"
import { tsconfigLocation, writeTsconfig } from "./tsconfig"

type Options = {
    projectPath: string,
    checkTypes: boolean,
}

export async function buildProject({
        projectPath,
        checkTypes,
    }: Options,
): Promise<void> {
    const task = makeTaskFactory({
        logDirectory: join(projectPath, buildLogsDirectory),
    })
    const start = performance.now()
    const ms = () => Math.round(performance.now() - start)
    const idFile = join(projectPath, buildIdFile)
    const statusFile = join(projectPath, buildStatusFile)
    let criticalBuildDone = false
    let checksDone = false
    try {
        await Promise.all([
            rm(idFile, { recursive: true, force: true }),
            rm(statusFile, { recursive: true, force: true }),
            deleteFilesInDir(join(projectPath, buildLogsDirectory)),
        ])
        await Promise.all([
            writeFile(idFile, randomUUID()),
            writeFile(statusFile, status.building),
        ])

        const projectJson = task("generate JSON", () => generateProjectJson(projectPath))
        const generateEntryPoint = task("generate TS", () => generateImportEverything(projectPath))
        const tsconfig = task("generate tsconfig.json", () => writeTsconfig(projectPath))
        const checkTypesPromise = checkTypes ?
            task("check types", () => compileTypescript(projectPath),
                projectJson, generateEntryPoint, tsconfig) :
            Promise.resolve()
        checkTypesPromise.then(() => checksDone = true, noOp)
        const sync = task("sync assets", () => syncAssets(projectPath))
        const compile = task("build TS", () => runEsbuild(
            join(projectPath, everythingEntryPointFile),
            join(projectPath, tsconfigLocation),
            join(projectPath, distGameJsFile)
        ), projectJson, generateEntryPoint, tsconfig)
        const html = task("generate HTML", () => generateProjectHtml(projectPath))
        if (checkTypes) {
            Promise.all([sync, compile]).then(async () => {
                criticalBuildDone = true
                if (!checksDone) {
                    cyanInfo(`critical build finished after ${ms()} ms`)
                    await writeFile(statusFile, status.builtButTesting)
                }
            }, noOp)
        }
        await Promise.all([
            tsconfig,
            projectJson,
            compile,
            sync,
            html,
            checkTypesPromise,
        ])

        cyanInfo(`full build finished after ${ms()} ms`)
        await writeFile(statusFile, status.succeeded)
    } catch (e) {
        if (!(e instanceof AlreadyPrintedError)) {
            console.error(getErrorString(e))
        }
        redError(`build failed after ${ms()} ms`)
        if (criticalBuildDone) {
            await writeFile(statusFile, status.builtWithErrors)
        } else {
            await writeFile(statusFile, status.failed)
        }
    }
}

async function deleteFilesInDir(dir: string) {
    try {
        const files = await readdir(dir)
        await Promise.all(files.map(f => rm(join(dir, f), { force: true })))
    } catch (e) {
        // Do nothing.
    }
}
