import { build } from "esbuild"
import * as fsOrig from "fs"
const fs = fsOrig.promises

export async function runEsbuild(entryPointPath: string, tsconfigPath: string, outputFilePath: string): Promise<void> {
    await build({
        entryPoints: [entryPointPath],
        bundle: true,
        platform: "neutral",
        format: "iife",
        mainFields: ["module"],
        tsconfig: tsconfigPath,
        outfile: outputFilePath,
        sourcemap: true,
    })
    // await writeTsconfig(projectPath)
    // const esbuildBinaryPath = require.resolve("esbuild/bin/esbuild")
    // const process = childProcess.fork(esbuildBinaryPath, [
    //     entryPointPath,
    //     "--bundle",
    //     "--platform=iife",
    //     `--tsconfig=${tsconfigPath}`,
    //     `--outfile=${outputFilePath}`,
    // ], {
    //     cwd: projectPath
    // })
    // return new Promise((resolve, reject) => {
    //     process.on("exit", code => {
    //         if(code === 0) {
    //             resolve()
    //         } else {
    //             reject("Project esbuild compilation failed")
    //         }
    //     })
    // })
}
