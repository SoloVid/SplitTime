import { performance } from "perf_hooks"
import { greenInfo } from "./color-output"

export async function task(
    name: string,
    callback: () => PromiseLike<unknown>,
    ...dependencies: PromiseLike<unknown>[]
): Promise<void> {
    await Promise.all(dependencies)
    await timeThis(name, callback)
}

async function timeThis(name: string, callback: () => PromiseLike<unknown>): Promise<void> {
    const start = performance.now()
    await callback()
    const end = performance.now()
    const ms = Math.round(end - start)
    greenInfo(`${name} finished in ${ms} ms`)
}