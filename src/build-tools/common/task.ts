import { performance } from "perf_hooks"

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
    const seconds = ((end - start) / 1000).toFixed(1)
    console.log(`${name} - ${seconds}s`)
}