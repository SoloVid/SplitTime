import * as path from "path"
import { async as syncDirectory } from "sync-directory"

export async function syncAssets(projectPath: string): Promise<void> {
    await Promise.all([
        syncDirectory(
            path.resolve(path.join(projectPath, "images")),
            path.resolve(path.join(projectPath, "dist", "images")),
            {
                type: "copy",
                deleteOrphaned: true,
            }
        ),
        syncDirectory(
            path.resolve(path.join(projectPath, "audio")),
            path.resolve(path.join(projectPath, "dist", "audio")),
            {
                type: "copy",
                deleteOrphaned: true,
            }
        ),
    ])
}
