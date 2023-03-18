import { readdir, readFile } from "node:fs/promises";
import { join } from "./file-helper";
import ignore, { Ignore } from "ignore"
import { relative } from "node:path";

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

export async function forNotIgnoredFiles(dir: string, withFile: (file: string) => PromiseLike<void> | void): Promise<void> {
  const i = await getIgnore(dir)
  return forNotIgnoredFilesInner(dir, i, dir, withFile)
}

async function forNotIgnoredFilesInner(baseDir: string, i: Ignore, dir: string, withFile: (file: string) => PromiseLike<void> | void): Promise<void> {
  const listing = await readdir(dir, { withFileTypes: true })
  await Promise.all(listing.map(async (f) => {
    const fullPath = join(dir, f.name)
    const relativePath = relative(baseDir, fullPath)
    if (i.ignores(relativePath)) {
      return
    }
    if (f.isDirectory()) {
      await forNotIgnoredFilesInner(baseDir, i, fullPath, withFile)
    } else {
      await withFile(fullPath)
    }
  }))
}

async function getIgnore(dir: string) {
  const i = ignore().add(["/.git/"])
  try {
    const gitIgnore = await readFile(join(dir, ".gitignore"), "utf-8")
    const lines = gitIgnore.split("\n").map(l => l.trim())
    i.add(lines)
  } catch (e) {
    // Do nothing.
  }
  return i
}
