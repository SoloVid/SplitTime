import * as fsOrig from "fs"
import { minify } from "uglify-js"
import { join, writeFile } from "../common/file-helper"
const fs = fsOrig.promises

export async function minifyGame(projectRoot: string): Promise<void> {
    const [ source, sourceMap ] = await Promise.all([
        fs.readFile(join(projectRoot, "dist/game.js")),
        fs.readFile(join(projectRoot, "dist/game.js.map"))
    ])
    const result = minify(source.toString(), {
        sourceMap: {
            content: JSON.parse(sourceMap.toString()),
            filename: "game.min.js",
            url: "game.min.js.map"
        },
        compress: {
            unsafe: true
        },
        output: {
            comments: /license/i
        }
    })
    await Promise.all([
        writeFile(join(projectRoot, "dist/game.min.js"), result.code),
        writeFile(join(projectRoot, "dist/game.min.js.map"), result.map)
    ])
}