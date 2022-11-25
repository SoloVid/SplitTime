import assert from "node:assert"
import { readdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join, relative, sep as sepPosix } from "node:path/posix"
import { relative as relativeNative, sep as sepNative } from "node:path"
import { Tsconfig } from "../project/tsconfig"
import { forAllFiles } from "./walk-files"

export async function resolveDeclarationNonRelativePaths(dir: string) {
  // console.log(dir)
  // console.log(__dirname)
  // dir = relativeNative(__dirname, dir).replace(/\\/g, "/")
  dir = dir.split(sepNative).join(sepPosix)
  // console.log(dir)
  const tsconfigContents = await readFile(join(dir, "tsconfig.json"), "utf-8")
  const tsconfig = JSON.parse(tsconfigContents) as Tsconfig
  const rootDir = tsconfig.compilerOptions?.rootDir
  assert(rootDir, "rootDir should be set in tsconfig.json")
  const declarationDir = tsconfig.compilerOptions?.declarationDir
  assert(declarationDir, "declarationDir should be set in tsconfig.json")
  const fullDeclarationDir = join(dir, declarationDir)
  const baseUrl = tsconfig.compilerOptions?.baseUrl ?? "."
  const relativeOutputBaseUrl = relative(join(dir, baseUrl), join(dir, rootDir))
  const pathsConfig = tsconfig.compilerOptions?.paths ?? {}
  const baseUrlListing = await readdir(join(dir, baseUrl), { withFileTypes: true })
  const baseUrlOptions = baseUrlListing.map(e => e.isDirectory() ? [e.name, e.name] as const : [e.name.replace(/\.ts$/, ""), e.name] as const).reduce((o, mapping) => ({...o, [mapping[0]]: mapping[1]}), {} as Record<string, string>)
  // console.log("Walking files in", fullDeclarationDir)
  await forAllFiles(fullDeclarationDir, async (f) => {
    // console.log(`Analyzing ${f}`)
    const contents = await readFile(f, "utf-8")
    // console.log(`${contents.length} bytes`)
    const modifiedContents = contents.replace(/(?<=from ["'])[^.][^/"']*(?=.*?["'];?$)/gm, (match) => {
      // console.log(`found ${match} in ${f}`)
      if (match in pathsConfig) {
        return pathsConfig[match][0]
      }
      if (match in baseUrlOptions) {
        // console.log("f", f)
        // console.log("fullDeclarationDir", fullDeclarationDir)
        // console.log("relativeOutputBaseUrl", relativeOutputBaseUrl)
        // console.log("dirname(f)", dirname(f))
        // console.log("relative(dirname(f), fullDeclarationDir)", relative(dirname(f), fullDeclarationDir))
        // console.log(`replacing ${match} with ${join(relative(dirname(f), fullDeclarationDir), relativeOutputBaseUrl, match)}`)
        // I'm not very confident that the relativeOutputBaseUrl part of this expression is correct.
        // As the project sits right now, it's basically a no-op, but if the project changes it may become wrong.
        return join(relative(dirname(f), fullDeclarationDir), relativeOutputBaseUrl, match)
      }
      return match
    })
    await writeFile(f, modifiedContents)
  })
}