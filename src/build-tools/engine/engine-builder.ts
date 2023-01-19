import esbuild from "esbuild"
import { readdir } from "node:fs/promises"
import { join } from "node:path"
import type { Builder } from "./builder"
import rootDir from "./root-dir"

export const apiDir = join(rootDir, "src", "api")
export const engineDir = join(rootDir, "src", "engine")

export async function getEngineBuilder(): Promise<Builder> {
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
    printErrors: false,
    watchList: [apiDir, engineDir],
  }
}
