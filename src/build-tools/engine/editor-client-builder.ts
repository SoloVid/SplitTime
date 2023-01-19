import esbuild from "esbuild"
import { join } from "node:path"
import type { Builder } from "./builder"
import { apiDir, engineDir } from "./engine-builder"
import rootDir from "./root-dir"

export const editorClientDir = join(rootDir, "src", "editor", "client")

export async function getEditorClientBuilder(): Promise<Builder> {
  const ctx = await esbuild.context({
    logLevel: "info",
    entryPoints: [join(editorClientDir, "index.tsx")],
    bundle: true,
    platform: "browser",
    jsx: "automatic",
    outfile: join(rootDir, "lib", "editor-client.js"),
    sourcemap: true,
    minify: true,
  })
  return {
    name: "editor client build",
    run: () => ctx.rebuild(),
    printErrors: false,
    watchList: [editorClientDir, apiDir, engineDir],
  }
}
