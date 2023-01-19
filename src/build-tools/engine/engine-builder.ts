import { debounce } from "../common/debounce"
import esbuild from "esbuild"
import { readdir } from "node:fs/promises"
import { join } from "node:path"
import type { Builder } from "./builder"
import rootDir from "./root-dir"

export async function getEngineBuilder(): Promise<Builder> {
  const apiDir = join(rootDir, "src", "api")
  const listing = await readdir(apiDir)
  const ctx = await esbuild.context({
    logLevel: "info",
    entryPoints: listing.map(e => join(apiDir, e)),
    bundle: true,
    splitting: true,
    format: "esm",
    minify: true,
    sourcemap: true,
    outdir: join(rootDir, "lib", "api"),
  })
  return {
    name: "engine build",
    run: () => ctx.rebuild(),
    // run: debounce(() => ctx.rebuild(), 50),
    printErrors: false,
    watchList: [apiDir, join(rootDir, "src", "engine")],
  }
}
