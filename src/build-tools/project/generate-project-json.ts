import * as fsOrig from "fs"
import * as pathOrig from "path"
import * as rrdir from "rrdir"
import { join, slash, writeFile } from "../common/file-helper"
import {
    COLLAGE_DIRECTORY,
    IMAGE_DIRECTORY,
    LEVEL_DIRECTORY,
    MUSIC_DIRECTORY,
    PRELOADED_IMAGE_DIRECTORY,
    SOUND_EFFECT_DIRECTORY
} from "./constants"
const fs = fsOrig.promises
const path = pathOrig.posix

type FileDataMap = { [relFilePath: string]: object }

// FTODO: Synchronize type with type in engine code
interface CompiledGameData {
    levels: FileDataMap
    collages: FileDataMap
    musicFiles: string[]
    imageFiles: string[]
    preloadedImageFiles: string[]
    soundEffectFiles: string[]
}

export async function generateProjectJson(projectRoot: string): Promise<void> {
    const gameData: CompiledGameData = {
        levels: {},
        collages: {},
        imageFiles: [],
        preloadedImageFiles: [],
        musicFiles: [],
        soundEffectFiles: [],
    }
    await Promise.all([
        getJsonFileDataMap(join(projectRoot, LEVEL_DIRECTORY))
            .then(map => { gameData.levels = map }),
        getJsonFileDataMap(join(projectRoot, COLLAGE_DIRECTORY))
            .then(map => { gameData.collages = map }),
        getAllRelativePaths(join(projectRoot, IMAGE_DIRECTORY))
            .then(list => { gameData.imageFiles = list }),
        getAllRelativePaths(join(projectRoot, PRELOADED_IMAGE_DIRECTORY))
            .then(list => { gameData.preloadedImageFiles = list }),
        getAllRelativePaths(join(projectRoot, MUSIC_DIRECTORY))
            .then(list => { gameData.musicFiles = list }),
        getAllRelativePaths(join(projectRoot, SOUND_EFFECT_DIRECTORY))
            .then(list => { gameData.soundEffectFiles = list }),
    ])

    const dataFileContents =
        "var G = G || {};\nG._GAME_DATA = " + JSON.stringify(gameData) + ";"
    const generatedFile = "build/generated/data.js"
    await writeFile(join(projectRoot, generatedFile), dataFileContents)
}

async function getAllRelativePaths(dir: string): Promise<string[]> {
    const relPaths: string[] = []
    for await (const entry of rrdir(dir)) {
        if (entry.directory) {
            continue
        }
        const relPath = path.relative(dir, slash(entry.path))
        relPaths.push(relPath)
    }
    return relPaths
}

async function getJsonFileDataMap(dir: string): Promise<FileDataMap> {
    const map: FileDataMap = {}
    for await (const entry of rrdir(dir)) {
        if (entry.directory) {
            continue
        }
        const relPath = path.relative(dir, slash(entry.path))
        if (/\.json$/.test(entry.path)) {
            const contents = await fs.readFile(entry.path)
            const fileData = JSON.parse(contents.toString())
            map[relPath] = fileData
        } else {
            console.warn("Non-JSON file found in level directory: " + relPath)
        }
    }
    return map
}
