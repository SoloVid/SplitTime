import { readdir, readFile } from "node:fs/promises"


const listing = await readdir(".")
for (const f of listing) {
  if (!f.startsWith("splitTime.")) {
    continue
  }
  console.log(f)
}

const splitTimeImport = /^import\b.+?from "[^"]*(splitTime[^"]*)";?$/m
const namedImportRegex = /import(?: type)?\b[^{]+\{([^}]+)\}.+?from ".*(splitTime[^"]*)"/
const starAliasImportRegex = /import \* as (\S+) from ".*(splitTime[^"]*)"/
const starRawImportRegex = /import \* as (\S+) from ".*(splitTime[^"]*)"/

async function getExports(file) {
  const contents = await readFile(file, "utf-8")
}

async function getNamedExports(contents) {
  const r = new RegExp(namedImportRegex, "y")
  let m = r.exec(contents)
  while (m !== null) {
    const names
    m = r.exec(contents)
  }
}
