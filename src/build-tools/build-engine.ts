#!/usr/bin/env node

import { glob } from "glob";
import { buildEngine } from "./engine/build-engine";

async function run() {
    // glob('build/tsjs/editor/server/**/*.js', (er, files) => {
    //     console.log(files)
    // })

    try {
        await buildEngine()
    } catch (e: unknown) {
        console.error(e)
        process.exit(1)
    }
}

run()
