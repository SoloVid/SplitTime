#!/usr/bin/env node

import { buildProject } from "./project/build-project"

async function run() {
    try {
        const projectName = process.argv[2]
        if (projectName) {
            const projectPath = "projects/" + projectName
            console.log(`Building ${projectName}...`)
            await buildProject(projectPath)
        } else {
            console.log("Building project in current directory")
            await buildProject(".")
        }
    } catch (e: unknown) {
        console.error(e)
        process.exit(1)
    }
}

run()
