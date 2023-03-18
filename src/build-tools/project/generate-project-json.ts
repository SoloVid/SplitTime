import { readFile } from "node:fs/promises"
import { join, relative, writeFile } from "../common/file-helper"
import { forNotIgnoredFiles } from "../common/walk-files"
import YAML from "yaml"
import { generatedDirectory } from "./constants"

type FileDataMap = { [relFilePath: string]: object }

// FTODO: Synchronize type with type in engine code
interface CompiledGameData {
    levels: FileDataMap
    collages: FileDataMap
    imageFiles: string[]
    audioFiles: string[]
}

export const supportedAudioFilePatterns = [/\.mp3$/]
export const supportedImageFilePatterns = [/\.jpg$/, /\.png$/]

export async function generateProjectJson(projectRoot: string): Promise<void> {
    const gameData: CompiledGameData = {
        levels: {},
        collages: {},
        imageFiles: [],
        audioFiles: [],
    }
    await forNotIgnoredFiles(projectRoot, async (f) => {
        const relPath = relative(projectRoot, f)
        if (/\.lvl\.yml$/.test(f)) {
            gameData.levels[relPath] = YAML.parse(await readFile(f, "utf-8"))
        } else if (/\.clg\.yml$/.test(f)) {
            gameData.collages[relPath] = YAML.parse(await readFile(f, "utf-8"))
        } else if (supportedAudioFilePatterns.some(p => p.test(f))) {
            gameData.audioFiles.push(relPath)
        } else if (supportedImageFilePatterns.some(p => p.test(f))) {
            gameData.imageFiles.push(relPath)
        }
    })

    const dataFileContents = `// GENERATED FILE. DO NOT MODIFY.

import { Assets } from "splittime"
import { getScriptDirectory } from "splittime/system"

/** @deprecated Use {@link assets} instead. */
export const gameData = ${JSON.stringify(gameData, null, 2)} as const

export const assets = new Assets(getScriptDirectory(), gameData)
/** @deprecated Use {@link assets} instead. */
export const ASSETS = assets

`;
    const generatedFile = join(generatedDirectory, "assets.ts")
    await writeFile(join(projectRoot, generatedFile), dataFileContents)
}
