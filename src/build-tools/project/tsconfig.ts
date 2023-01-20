import { readFile } from "node:fs/promises"
import { dirname } from "node:path"
import { CompilerOptions } from "typescript"
import { join, relative, writeFile } from "../common/file-helper"

export async function writeTsconfig(projectPath: string): Promise<void> {
  const file = join(projectPath, tsconfigLocation)
  const contents = JSON.stringify(await getTsconfig(projectPath), null, 4)
  await writeFile(file, contents)
}

async function getTsconfig(projectPath: string): Promise<Tsconfig> {
  const config = makeDefaultTsconfig()
  const userConfig = await getUserTsconfig(projectPath)
  if (userConfig !== null) {
      if (userConfig.extends) {
          config.extends = userConfig.extends
      }
      if (userConfig.compilerOptions) {
          for (const option in userConfig.compilerOptions) {
              if (option === "baseUrl") {
                  const relPathFromGeneratedConfigToUserConfig = relative(join(projectPath, dirname(tsconfigLocation)), projectPath)
                  config.compilerOptions.baseUrl = join(relPathFromGeneratedConfigToUserConfig, userConfig.compilerOptions.baseUrl!)
              } else {
                  config.compilerOptions[option] = userConfig.compilerOptions[option]
              }
          }
      }
  }
  config.compilerOptions.outDir = "../tsjs"
  return config
}

async function getUserTsconfig(projectPath: string): Promise<Tsconfig | null> {
  const userConfig = join(projectPath, "tsconfig.json")
  try {
      const contents = await readFile(userConfig)
      const config = JSON.parse(contents.toString())
      if (typeof config !== "object") {
          return null
      }
      if ("compilerOptions" in config) {
          return config
      }
      return null
  } catch (e: unknown) {
      return null
  }
}

export const tsconfigLocation = "build/generated/tsconfig.json"
function makeDefaultTsconfig(): Required<Tsconfig> {
  return {
      extends: "splittime/tsconfig.project.json",
      compilerOptions: {},
      include: [
          "../../src/**/*.ts"
      ]
  }
}

export interface Tsconfig {
  extends?: string
  compilerOptions?: CompilerOptions
  include?: string[]
}
