import { task } from "../common/task"
import { concatEngineSource } from "./concat-mapped"
import { generateDeclarations } from "./generate-declarations"

export async function buildEngine(): Promise<void> {
    await task("buildEngine", () => Promise.all([
        concatEngineSource(),
        generateDeclarations()
    ]))
    // FTODO: Add minification step for engine
}
