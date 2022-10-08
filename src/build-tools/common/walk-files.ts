import { readdir } from "fs/promises";
import { join } from "./file-helper";

export async function forAllFiles(dir: string, withFile: (file: string) => PromiseLike<void> | void): Promise<void> {
  const listing = await readdir(dir, { withFileTypes: true })
  await Promise.all(listing.map(async (f) => {
    const fullPath = join(dir, f.name)
    if (f.isDirectory()) {
      await forAllFiles(fullPath, withFile)
    } else {
      await withFile(fullPath)
    }
  }))
}