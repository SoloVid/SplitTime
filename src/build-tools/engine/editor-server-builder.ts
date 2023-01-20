import esbuild from "esbuild"
import { join } from "node:path"
import type { Builder } from "./builder"
import { apiDir, engineDir } from "./engine-builder"
import rootDir from "./root-dir"

export const editorServerDir = join(rootDir, "src", "editor", "server")

export async function getEditorServerBuilder(): Promise<Builder> {
  const ctx = await esbuild.context({
    logLevel: "info",
    entryPoints: [join(editorServerDir, "main.ts")],
    bundle: true,
    platform: "node",
    outfile: join(rootDir, "lib", "editor-server.js"),
    sourcemap: true,
    minify: true,
  })
  return {
    name: "editor server build",
    run: () => ctx.rebuild(),
    close: () => ctx.dispose(),
    printErrors: false,
    watchList: [editorServerDir, apiDir, engineDir],
  }
}
