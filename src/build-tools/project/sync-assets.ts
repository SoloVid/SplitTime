import { forAllFiles, forNotIgnoredFiles } from "build-tools/common/walk-files"
import { copyFile, mkdir, rm, stat } from "node:fs/promises"
import { dirname, join, relative, resolve } from "node:path"
import { distDirectory } from "./constants"
import { supportedAudioFilePatterns, supportedImageFilePatterns } from "./generate-project-json"

export async function syncAssets(projectPath: string): Promise<void> {
    await Promise.all([
        copyNew(projectPath),
        removeOld(projectPath),
    ])
}

async function copyNew(projectPath: string) {
    const targetDir = resolve(join(projectPath, distDirectory))
    await forNotIgnoredFiles(projectPath, async (f) => {
        const relPath = relative(projectPath, f)
        if (!isFileApplicable(relPath)) {
            return
        }

        const targetFile = join(targetDir, relPath)
        const shouldCopy = await isFileOutOfDate(f, targetFile)
        if (shouldCopy) {
            await mkdir(dirname(targetFile), { recursive: true })
            await copyFile(f, targetFile)
        }
    })
}

async function removeOld(projectPath: string) {
    const targetDir = resolve(join(projectPath, distDirectory))
    await forAllFiles(targetDir, async (f) => {
        const relPath = relative(targetDir, f)
        if (!isFileApplicable(relPath)) {
            return
        }

        const sourceFile = join(projectPath, relPath)
        const shouldKeep = await existsAsync(sourceFile)
        if (!shouldKeep) {
            await rm(f)
        }
    })
}

function isFileApplicable(relativePath: string): boolean {
    if (supportedAudioFilePatterns.some(p => p.test(relativePath))) {
        return true
    }
    if (supportedImageFilePatterns.some(p => p.test(relativePath))) {
        return true
    }
    return false
}

async function isFileOutOfDate(sourceFilePath: string, targetFilePath: string): Promise<boolean> {
    const sourceStats = await stat(sourceFilePath)
    try {
        const targetStats = await stat(targetFilePath)
        if (targetStats.mtimeMs < sourceStats.mtimeMs) {
            return true
        }
    } catch (e) {
        // Target probably just doesn't exist.
        return true
    }
    return false
}

async function existsAsync(path: string): Promise<boolean> {
    try {
        await stat(path)
        return true
    } catch (e) {
        return false
    }
}
