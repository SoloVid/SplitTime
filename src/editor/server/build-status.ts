import { buildIdFile, buildLogsDirectory, buildStatusFile } from "build-tools/project/constants"
import { Status, status } from "build-tools/project/status"
import { readdir, readFile } from "node:fs/promises"
import type { PathHelper } from "./path-helper"

export type KnownBuildStatus = {
  lastBuildId?: string
  knownErrorLogs?: readonly string[]
}

export type BuildStatus = {
  buildId: string | null
  status: Status | null
  errorLogs: Record<string, string>
}

type Options = {
  pathHelper: PathHelper
}

export async function getBuildStatus(
  projectId: string,
  knownBuildStatus: KnownBuildStatus,
  { pathHelper }: Options
): Promise<BuildStatus> {
  const buildId = await tryReadFile(pathHelper.getFilePath(projectId, buildIdFile))
  const buildStatus = await tryReadFile(pathHelper.getFilePath(projectId, buildStatusFile))
  if (buildId === null || buildStatus === null) {
    return {
      buildId: null,
      status: null,
      errorLogs: {},
    }
  }
  const knownErrorLogs = knownBuildStatus.knownErrorLogs ?? []
  const errorLogFileNames = await tryReadDir(pathHelper.getFilePath(projectId, buildLogsDirectory))
  const errorLogTuples = await Promise.all(errorLogFileNames.filter(f => {
    // console.log(knownBuildStatus)
    // console.log(`${buildId} vs ${knownBuildStatus.lastBuildId}`)
    // console.log(`${f} in? ${JSON.stringify(knownErrorLogs)}`)
    // console.log(buildId !== knownBuildStatus.lastBuildId)
    // console.log(!knownErrorLogs.includes(f))
    return buildId !== knownBuildStatus.lastBuildId || !knownErrorLogs.includes(f)
  }).map(async f => {
    // console.log("reading ", f)
    const contents = await tryReadFile(pathHelper.getFilePath(projectId, buildLogsDirectory, f))
    return [f, contents] as const
  }))
  const errorLogMap = errorLogTuples.reduce((map, [logName, logContents]) => {
    if (logContents === null) {
      return map
    }
    return {
      ...map,
      [logName]: logContents,
    }
  }, {} as Record<string, string>)
  return {
    buildId: buildId,
    status: buildStatus as Status | null,
    errorLogs: errorLogMap,
  }
}

async function tryReadFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf-8")
  } catch (e) {
    return null
  }
}

async function tryReadDir(path: string): Promise<readonly string[]> {
  try {
    return await readdir(path)
  } catch (e) {
    return []
  }
}
