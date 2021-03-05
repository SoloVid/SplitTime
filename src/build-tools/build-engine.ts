#!/usr/bin/env node

import { buildEngine } from "./engine/build-engine"

async function run() {
    try {
        await buildEngine()
    } catch (e: unknown) {
        console.error(e)
        process.exit(1)
    }
}

run()
