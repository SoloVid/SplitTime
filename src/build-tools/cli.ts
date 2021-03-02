#!/usr/bin/env node

import { buildProject } from "./project/build-project"

async function run() {
    try {
        const command = process.argv[2]
        switch (command) {
            case "build":
                console.log("Building project in current directory")
                await buildProject(".")
                break
            default:
                console.error("Unrecognized command")
                process.exit(1)
        }
    } catch (e: unknown) {
        console.error(e)
        process.exit(1)
    }
}

run()
