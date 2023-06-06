import assert from "node:assert"
import { readFile, rm, writeFile } from "node:fs/promises"
import path, { relative } from "node:path"
import sharp from "sharp"
import { forNotIgnoredFiles } from "../common/walk-files"
import YAML from "yaml"
import { generateUID } from "engine/utils/misc"

void run()

async function run() {
  try {
    await runUnsafe()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

async function runUnsafe() {
  const dir = process.argv[2]
  const stuffToDo: (() => PromiseLike<void>)[] = []
  await forNotIgnoredFiles(dir, async (f) => {
    const relPath = relative(dir, f)
    if (await shouldModifyFile(f, relPath)) {
      stuffToDo.push(() => modifyFile(f, relPath))
    }
  })
  await Promise.all(stuffToDo.map(t => t()))
}

async function shouldModifyFile(path: string, relPath: string): Promise<boolean> {
  const patterns: RegExp[] = [
    // /\.png$/,
    // /\.jpg$/,
    // /\.clg\.yml$/,
    /\.lvl\.yml$/,
  ]
  if (patterns.some(p => p.test(relPath))) {
    console.log(`Matched ${path}`)
    return true
  }
  return false
}

async function modifyFile(oldPath: string, oldRelPath: string): Promise<void> {
  console.log(`Modifying ${oldPath}...`)

  const scale = 0.5

  // const oldContents = await readFile(oldPath)
  // const image = sharp(oldContents)
  // const metadata = await image.metadata()
  // assert(metadata.width && metadata.height, "Image width and height should be available")
  // const newContents = await image.resize(Math.round(metadata.width * scale), Math.round(metadata.height * scale)).toBuffer()

  const oldContents = await readFile(oldPath, "utf-8")
  const f = YAML.parse(oldContents)
  for (const g of f.groups) {
    // const oldId = g.id
    // g.name = oldId
    // const newId = generateUID()
    // g.id = newId
    for (const o of f.groups) {
      if (o.parent === g.name) {
        o.parent = g.id
      }
    }
    // for (const t of f.traces) {
    //   t.group = newId
    // }
    // for (const p of f.props) {
    //   p.group = newId
    // }
    // for (const p of f.positions) {
    //   p.group = newId
    // }
  }
  // for (const t of f.traces) {
  //   t.name = t.id
  //   t.id = generateUID()
  // }
  // for (const t of f.props) {
  //   t.name = t.id
  //   t.id = generateUID()
  // }
  // for (const t of f.positions) {
  //   t.name = t.id
  //   t.id = generateUID()
  // }
  // for (const f of f.frames) {
  //   const oldId = f.id
  //   const newId = generateUID()
  //   f.id = newId
  //   for (const m of f.montages) {
  //     for (const mf of m.frames) {
  //       if (mf.frameId === oldId) {
  //         mf.frameId = newId
  //       }
  //     }
  //   }
  // }
  // for (const m of f.montages) {
  //   const oldId = m.id
  //   m.name = oldId
  //   m.id = generateUID()
  // }
  const newContents = YAML.stringify(f)
  // const newContents = oldContents.replace(/(?<!\.)\d+(?![".])/g, (oldValueStr) => {
  //   const oldValue = +oldValueStr
  //   const newValue = Math.round(oldValue * scale)
  //   return `${newValue}`
  // })
  // const newContents = oldContents.replace(/"(depth|width)": (\d+)/g, (m, field, value) => {
  //   const oldValue = +value
  //   if (oldValue % 2 === 0) {
  //     return `"${field}": ${value}`
  //   }
  //   console.log(`Found odd ${field} ${value} in ${oldPath}`)
  //   const newValue = oldValue === 1 ? 2 : oldValue - 1
  //   return `"${field}": ${newValue}`
  // })

  const newPath = oldPath

  await rm(oldPath)
  await writeFile(newPath, newContents)
  console.log(`Finished modifying ${oldPath}, now ${newPath}!`)
}
