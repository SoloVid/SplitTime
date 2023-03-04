import { AlreadyPrintedError } from "build-tools/project/already-printed-error"
import { rm } from "node:fs/promises"
import { performance } from "node:perf_hooks"
import { greenInfo, redError } from "./color-output"
import { getErrorString } from "./error-helper"
import { join, writeFile } from "./file-helper"

type Options = {
    logDirectory: string
}

export function makeTaskFactory(options: Options) {
    return async function task(
        name: string,
        callback: () => PromiseLike<unknown>,
        ...dependencies: PromiseLike<unknown>[]
    ): Promise<void> {
        const logFile = join(options.logDirectory, `${name.replace(/[ .]/g, "-").toLowerCase()}.error.log`)
        try {
            await Promise.all(dependencies)
        } catch (e) {
            throw new AlreadyPrintedError(e)
        }
        await rm(logFile, { recursive: true, force: true })
        try {
            await timeThis(name, callback)
        } catch (e) {
            const errorString = getErrorString(e)
            console.error(errorString)
            await writeFile(logFile, errorString)
            throw new AlreadyPrintedError(e)
        }
    }
}

async function timeThis(name: string, callback: () => PromiseLike<unknown>): Promise<void> {
    const start = performance.now()
    try {
        await callback()
        const end = performance.now()
        const ms = Math.round(end - start)
        greenInfo(`${name} finished in ${ms} ms`)
    } catch (e) {
        const end = performance.now()
        const ms = Math.round(end - start)
        redError(`${name} failed after ${ms} ms`)
        throw e
    }
}