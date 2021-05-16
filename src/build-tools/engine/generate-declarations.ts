import * as fsOrig from "fs"
import * as pathOrig from "path"
import * as rrdir from "rrdir"
import { slash, writeFile } from "../common/file-helper"
const fs = fsOrig.promises
const path = pathOrig.posix

export async function generateDeclarations() {
    const declRefs: string[] = []
    const dir = "build/@types/splitTime"
    for await (const entry of rrdir(dir)) {
        if (/index\.d\.ts$/.test(entry.path)) {
            // Skip index.d.ts
        } else if (/\.d\.ts$/.test(entry.path)) {
            const filePath = path.relative(dir, slash(entry.path))
            declRefs.push('/// <reference path="./' + filePath + '" />')
        } else {
            // Skip non-definition files
        }
    }
    const indexFileContents = declRefs.join("\n")
    await writeFile("build/@types/splitTime/index.d.ts", indexFileContents)
}
