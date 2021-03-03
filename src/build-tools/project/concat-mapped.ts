import * as fsOrig from "fs"
import * as glob from "glob"
import {
    concatFilesWithSourceMaps,
    countSlashesInPath,
} from "../common/concat-mapped"
import { getEngineRoot, join } from "../common/path-helper"
const fs = fsOrig.promises

export async function concatProjectSource(projectRoot: string): Promise<void> {
    const compiledSourceFiles = glob.sync(projectRoot + "/build/tsjs/**/*.js")
    // We're sorting by the number of slashes in the path ascending
    // so as to put the top-level directory files before the innermost directory files.
    const compiledSourceFilesSorted = compiledSourceFiles.sort(function (a, b) {
        const slashesInA = countSlashesInPath(a)
        const slashesInB = countSlashesInPath(b)
        return slashesInA - slashesInB
    })
    concatFilesWithSourceMaps(
        compiledSourceFilesSorted,
        join(projectRoot, "build/project-source.js")
    )
}

export async function concatEntireGameJs(projectRoot: string): Promise<void> {
    const engineRoot = getEngineRoot()
    const files = [
        join(engineRoot, "build/engine.js"),
        join(engineRoot, "build/tsjs/defer.def.js"),
        join(projectRoot, "build/generated/**/*.js"),
        join(projectRoot, "build/project-source.js"),
        join(engineRoot, "build/tsjs/defer.run.js"),
    ]
    concatFilesWithSourceMaps(files, projectRoot + "/dist/game.js")
}
