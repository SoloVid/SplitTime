import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path/posix"

async function walkFiles(dir, withFile) {
  const listing = await readdir(dir, { withFileTypes: true })
  for (const f of listing) {
    if (f.isDirectory()) {
      await walkFiles(join(dir, f.name), withFile)
    } else {
      await withFile(join(dir, f.name))
    }
  }
}

const splitTimeImport = /^import\b.+?from "[^"]*(splitTime[^"]*)";?$/m
const namedImportRegex = /import(?: type)?\b[^{]+\{([^}]+)\}.+?from ".*(splitTime[^"]*)"/
const starAliasImportRegex = /import \* as (\S+) from ".*(splitTime[^"]*)"/
const starRawImportRegex = /import \* as (\S+) from ".*(splitTime[^"]*)"/

await walkFiles(".", async (f) => {
  // console.log(f)
  const contents = await readFile(f, "utf-8")
  const lines = contents.split("\n").map(l => l.trim())
  const r = new RegExp(splitTimeImport, "ym")
  const importSplitTimeLines = []
  let m = r.exec(contents)
  while (m !== null) {
    // console.log("match", m[0])
    importSplitTimeLines.push(m[0])
    m = r.exec(contents)
  }
  // const importSplitTimeLines = lines.filter(l => /from "[^"]*splitTime/.test(l))
  for (const importLine of importSplitTimeLines) {
    console.log(importLine, `(from ${f})`)
    const uses = determineUses(importLine, contents)
    for (const u of uses) {
      console.log(`${u.thing} |from| ${u.source}`)
    }
  }
})

function determineUses(importLine, fileContents) {
  const matchNamed = /import(?: type)? \{([^}]+)\} from ".*(splitTime[^"]*)"/.exec(importLine)
  if (matchNamed !== null) {
    const importedThings = matchNamed[1].split(",").map(e => {
      const spl = e.trim().split(" ")
      return spl[spl.length - 1].trim()
    })
    return importedThings.map(t => ({
      nameInSource: t,
      thing: t,
      source: matchNamed[2],
    }))
  } else {
    const matchStar = /import \* as (\S+) from ".*(splitTime[^"]*)"/.exec(importLine)
    if (matchStar === null) {
      console.warn("Unexpected import", importLine)
      return []
    }

    const foundSet = new Set()

    const name = matchStar[1]
    const matchStarNameRegex = new RegExp(`\\b${name}\\.([A-Za-z0-9_.]+)\\b`, "g")
    let matchStarName = matchStarNameRegex.exec(fileContents)
    while (matchStarName !== null) {
      foundSet.add(matchStarName[1])

      matchStarName = matchStarNameRegex.exec(fileContents)
    }

    return [...foundSet].map(t => ({
      nameInSource: `${name}.${t}`,
      thing: t,
      source: matchStar[2],
    }))
  }
  return []
}

async function lookupDirectImport(usage) {
  const hops = usage.thing.split(".")
  const originFileContents = await readFile(`${usage.source}.ts`)
}
