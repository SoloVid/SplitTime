import esbuild from "esbuild"
import { join } from "node:path"
import type { Builder } from "./builder"
import rootDir from "./root-dir"

export const buildToolsDir = join(rootDir, "src", "build-tools")

export async function getBuildToolsBuilder(): Promise<Builder> {
  const ctx = await esbuild.context({
    logLevel: "info",
    entryPoints: [
      join(buildToolsDir, "project", "project-build-cli.ts"),
    ],
    bundle: true,
    platform: "node",
    outdir: join(rootDir, "lib"),
    sourcemap: true,
    minify: true,
    external: ["esbuild", "typescript"],
  })
  return {
    name: "project build CLI build",
    run: () => ctx.rebuild(),
    close: () => ctx.dispose(),
    printErrors: false,
    watchList: [buildToolsDir],
  }
}
