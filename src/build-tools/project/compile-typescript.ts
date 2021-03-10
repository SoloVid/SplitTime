import * as childProcess from "child_process"
import * as fsOrig from "fs"
import { CompilerOptions } from "typescript"
import { join, writeFile } from "../common/file-helper"
const fs = fsOrig.promises

export async function compileTypescript(projectPath: string): Promise<void> {
    await writeTsconfig(projectPath)
    const tscBinaryPath = require.resolve("typescript/bin/tsc")
    const process = childProcess.fork(tscBinaryPath, [
        "--project", join(projectPath, tsconfigLocation),
    ], {
        cwd: projectPath
    })
    return new Promise((resolve, reject) => {
        process.on("exit", code => {
            if(code === 0) {
                resolve()
            } else {
                reject("Project TypeScript compilation failed")
            }
        })
    })
}

async function writeTsconfig(projectPath: string): Promise<void> {
    const file = join(projectPath, tsconfigLocation)
    const contents = JSON.stringify(await getTsconfig(projectPath), null, 4)
    await writeFile(file, contents)
}

async function getTsconfig(projectPath: string): Promise<Tsconfig> {
    const config = makeDefaultTsconfig()
    const userConfig = await getUserTsconfig(projectPath)
    if (userConfig !== null) {
        if (userConfig.extends) {
            config.extends = userConfig.extends
        }
        if (userConfig.compilerOptions) {
            for (const option in userConfig.compilerOptions) {
                config.compilerOptions[option] = userConfig.compilerOptions[option]
            }
        }
        // We can't support letting them use their own include patterns
        // because the current directory is different.
        // if (userConfig.include) {
        //     config.include = userConfig.include
        // }
    }
    config.compilerOptions.outDir = "../tsjs"
    return config
}

async function getUserTsconfig(projectPath: string): Promise<Tsconfig | null> {
    const userConfig = join(projectPath, "tsconfig.json")
    try {
        const contents = await fs.readFile(userConfig)
        const config = JSON.parse(contents.toString())
        if (typeof config !== "object") {
            return null
        }
        if ("compilerOptions" in config) {
            return config
        }
        return null
    } catch (e: unknown) {
        return null
    }
}

const tsconfigLocation = "build/generated/tsconfig.json"
function makeDefaultTsconfig(): Required<Tsconfig> {
    return {
        extends: "splittime/tsconfig.project.json",
        compilerOptions: {},
        include: [
            "../../src/**/*.ts"
        ]
    }
}

interface Tsconfig {
    extends?: string
    compilerOptions?: CompilerOptions
    include?: string[]
}
