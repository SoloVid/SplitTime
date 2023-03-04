import esbuild from "esbuild"
import { join } from "node:path"
import type { Builder } from "./builder"
import { editorClientDir } from "./editor-client-builder"
import { apiDir, engineDir } from "./engine-builder"
import rootDir from "./root-dir"

export const editorPlayItDir = join(rootDir, "src", "editor", "player")

export async function getEditorPlayerBuilder(): Promise<Builder> {
  const ctx = await esbuild.context({
    logLevel: "info",
    entryPoints: [join(editorPlayItDir, "index.tsx")],
    bundle: true,
    platform: "browser",
    jsx: "automatic",
    outfile: join(rootDir, "lib", "editor-player.js"),
    sourcemap: true,
    minify: true,
  })
  return {
    name: "editor player build",
    run: () => ctx.rebuild(),
    close: () => ctx.dispose(),
    printErrors: false,
    watchList: [editorPlayItDir, editorClientDir, apiDir, engineDir],
  }
}
