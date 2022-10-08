import { task } from "../common/task"
import { compileTypescript } from "./compile-typescript"
import { writeTsconfig } from "./tsconfig"

export async function testProject(projectPath: string): Promise<void> {
    await task("testProject", () => testProjectDependent(projectPath))
}

export async function testProjectDependent(
    projectPath: string,
    typesAvailable: PromiseLike<void> = Promise.resolve(),
): Promise<void> {
    const tsconfig = task("tsconfig", () => writeTsconfig(projectPath))
    const compile = task("compileTypescript", () => compileTypescript(projectPath), tsconfig, typesAvailable)
    await Promise.all([
        tsconfig,
        compile,
    ])
}
