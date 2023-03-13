import { exec } from "node:child_process"
import { GitTsApi } from "./api/git-ts-api"
import { Config } from "./config"
import { PathHelper } from "./path-helper"

const currentBranchCommand = "rev-parse --abbrev-ref HEAD"

export class GitTsApiBacking {
    private readonly pathHelper: PathHelper

    constructor(
        private readonly api: GitTsApi,
        private readonly config: Config
    ) {
        this.pathHelper = new PathHelper(config)
        this.api.diff.serve(async request => this.runGit("diff"))
        this.api.head.serve(async request => {
          const [
            branch,
            commit,
          ] = await Promise.all([
            this.runGit(currentBranchCommand),
            this.runGit(`git rev-parse HEAD`),
          ])
          return { branchName: branch, commitSha: commit }
        })
        this.api.restoreSnapshot.serve(async request => {
          // TODO: Implement restore snapshot.
          return null
        })
        this.api.takeSnapshot.serve(async request => {
          const safeMessageString = prepareShellString(request.data.message)
          const currentBranch = await this.runGit(currentBranchCommand)
          const safeBranchString = prepareShellString(currentBranch)
          await this.runGit(`add .`)
          await this.runGit(`commit -m ${safeMessageString}`)
          await this.runGit(`push --force origin ${safeBranchString}`)
          return null
        })
    }

    private runGit(command: string, useStderr: boolean = false) {
      return new Promise<string>((resolve, reject) => {
        exec(`git ${command}`, {
          cwd: this.config.projectDirectory,
        }, (e, stdout, stderr) => {
          if (e) {
            reject(e)
          } else {
            resolve(useStderr ? stderr : stdout)
          }
        })
      })
    }
}

function prepareShellString(unsafeInput: string): string {
  return "'" + unsafeInput.replace(/'/g, "'\\''") + "'"
}
