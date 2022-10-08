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
  console.log(userConfig)
  const baseConfig = await getBaseProjectTsconfig()
  if (userConfig !== null) {
      if (userConfig.extends) {
          config.extends = userConfig.extends
      }
      if (userConfig.compilerOptions) {
          for (const option in userConfig.compilerOptions) {
              if (option === "baseUrl") {
                  const relPathFromGeneratedConfigToUserConfig = relative(join(projectPath, dirname(tsconfigLocation)), projectPath)
                  console.log("baseUrl!", relPathFromGeneratedConfigToUserConfig)
                  config.compilerOptions.baseUrl = join(relPathFromGeneratedConfigToUserConfig, userConfig.compilerOptions.baseUrl!)
              // } else if (option === "paths") {
              //     const relPathFromGeneratedConfigToUserConfig = relative(join(projectPath, dirname(tsconfigLocation)), projectPath)
              //     // const relPathFromGeneratedConfigTo
              //     console.log("paths!", relPathFromGeneratedConfigToUserConfig)
              //     config.compilerOptions.paths = Object.entries(userConfig.compilerOptions.paths!).map(([alias, pathArr]) => [alias, pathArr.map(p => join(relPathFromGeneratedConfigToUserConfig, p))] as const).reduce((pathsObj, [alias, pathArr]) => ({ ...pathsObj, [alias]: pathArr }), {})
              } else {
                  config.compilerOptions[option] = userConfig.compilerOptions[option]
              }
          }
      }
      // We can't support letting them use their own include patterns
      // because the current directory is different.
      // if (userConfig.include) {
      //     config.include = userConfig.include
      // }
  }
  config.compilerOptions.outDir = "../tsjs"
  console.log(config)
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

async function getBaseProjectTsconfig(): Promise<Tsconfig | null> {
  const userConfig = join(__dirname, "..", "..", "..", "tsconfig.project.json")
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
      // extends: "splittime/tsconfig.project.json",
      compilerOptions: {},
      include: [
          "../../src/**/*.ts"
      ]
  }
}

interface Tsconfig {
  extends?: string
  compilerOptions?: CompilerOptions
  include?: string[]
}
