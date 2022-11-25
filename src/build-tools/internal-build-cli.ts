#!/usr/bin/env node

import { resolveDeclarationNonRelativePaths } from "./common/resolve-non-relative-paths"

const command = process.argv[2]
const childArgs = process.argv.slice(3)
switch (command) {
  case "resolve-paths":
    resolveDeclarationNonRelativePaths(childArgs[0] ?? ".")
    break
  default:
    console.error(`Unrecognized command ${command}`)
    process.exit(1)
}
