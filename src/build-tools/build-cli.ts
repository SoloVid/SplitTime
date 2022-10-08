#!/usr/bin/env node

import { buildProject } from "./project/build-project"

async function run() {
    try {
        const directory = process.argv[2]
        await buildProject(directory || ".")
    } catch (e: unknown) {
        console.error(e)
        process.exit(1)
    }
}

run()
