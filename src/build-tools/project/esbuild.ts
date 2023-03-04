import { build, formatMessages, PartialMessage } from "esbuild"
import * as fsOrig from "fs"
import { AlreadyPrintedError } from "./already-printed-error"
const fs = fsOrig.promises

export async function runEsbuild(entryPointPath: string, tsconfigPath: string, outputFilePath: string): Promise<void> {
    try {
        await build({
            logLevel: "silent",
            // logLevel: "warning",
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
        // // console.log(e)
        // for (const m of formattedMessages) {
        //     console.error(m)
        // }
        // // console.error(await formatMessages(e.errors, {kind: "error", color: true}))
        if ("warnings" in (e as object)) {
            const esbuildError = e as { errors: PartialMessage[], warnings: PartialMessage[] }
            const formattedMessages = [
                ...(await formatMessages(esbuildError.errors, {kind: "error", color: true})),
                ...(await formatMessages(esbuildError.warnings, {kind: "warning", color: true})),
            ]
            throw new Error(formattedMessages.join("\n"))
        }
        throw e
    }
}
