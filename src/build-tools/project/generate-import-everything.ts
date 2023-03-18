import { dirname } from "path"
import { join, relative, writeFile } from "../common/file-helper"
import { forNotIgnoredFiles } from "../common/walk-files"
import { generatedDirectory } from "./constants"

export const everythingEntryPointFile = join(generatedDirectory, "everything.js")

export async function generateImportEverything(projectPath: string): Promise<void> {
  const generatedFilePath = join(projectPath, everythingEntryPointFile)
  // const relFromGenToSrc = relative(dirname(generatedFilePath), root)
  const allFilesToImport = new Set<string>()
  await forNotIgnoredFiles(projectPath, async (f) => {
    if (!/\.ts$/.test(f)) {
      return
    }
    allFilesToImport.add(relative(dirname(generatedFilePath), f))
  })
  const contents = [...allFilesToImport].map(i => `import "${i}"`).join("\n")
  await writeFile(generatedFilePath, contents)
}