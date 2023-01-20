import { build } from "esbuild"
import * as fsOrig from "fs"
import { AlreadyPrintedError } from "./already-printed-error"
const fs = fsOrig.promises

export async function runEsbuild(entryPointPath: string, tsconfigPath: string, outputFilePath: string): Promise<void> {
    try {
        await build({
            logLevel: "warning",
            entryPoints: [entryPointPath],
            bundle: true,
            platform: "neutral",
            format: "iife",
            mainFields: ["module"],
            tsconfig: tsconfigPath,
            outfile: outputFilePath,
            sourcemap: true,
        })
    } catch (e) {
        if ("warnings" in (e as object)) {
            throw "TypeScript build failed"
            throw new AlreadyPrintedError(e)
        }
        throw e
    }
}
