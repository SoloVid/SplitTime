import { join } from "../common/file-helper"

export const buildDirectory = ".build"
export const generatedDirectory = join(buildDirectory, "generated")
export const buildLogsDirectory = join(buildDirectory, "logs")

export const buildIdFile = join(buildDirectory, "build-id.txt")
export const buildStatusFile = join(buildDirectory, "build-status.txt")

export const distDirectory = "dist"
export const distGameJsFileName = "game.js"
export const distGameJsFile = join(distDirectory, distGameJsFileName)
export const distHtmlFile = join(distDirectory, "index.html")
