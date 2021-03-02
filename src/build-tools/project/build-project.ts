import { concatProjectSource } from "./concat-mapped";
import { generateProjectJson } from "./generate-project-json";
import { syncAssets } from "./sync-assets";

export async function buildProject(projectPath: string): Promise<void> {
    await Promise.all([
        generateProjectJson(projectPath),
        concatProjectSource(projectPath),
        syncAssets(projectPath),
    ])
    // FTODO: Add minification step for project
}