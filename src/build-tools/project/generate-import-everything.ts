import { dirname } from "path"
import { join, relative, writeFile } from "../common/file-helper"
import { forAllFiles } from "../common/walk-files"

export const everythingEntryPointFile = "build/generated/everything.js"

export async function generateImportEverything(projectPath: string): Promise<void> {
  const root = join(projectPath, "src")
  const generatedFilePath = join(projectPath, everythingEntryPointFile)
  // const relFromGenToSrc = relative(dirname(generatedFilePath), root)
  const allFilesToImport = new Set<string>()
  await forAllFiles(root, async (f) => {
    if (!/\.ts$/.test(f)) {
      return
    }
    allFilesToImport.add(relative(dirname(generatedFilePath), f))
  })
  const contents = [...allFilesToImport].map(i => `import "${i}"`).join("\n")
  await writeFile(generatedFilePath, contents)
}