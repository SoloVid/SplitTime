import * as fsOrig from "fs"
import { concatFilesWithSourceMaps, runAfter } from "../common/concat-mapped"
import { glob } from "glob"
const fs = fsOrig.promises

export async function concatEngineSource(): Promise<void> {
    const engineWithoutDomPromise = runAfter(() => concatEngineWithoutDom())
    const enginePromise = runAfter(
        () => concatEngine(),
        engineWithoutDomPromise
    )
    const engineTestPromise = runAfter(() => concatEngineTest(), enginePromise)
    const editorServerLibPromise = runAfter(() => concatEditorServerLib())
    const editorServerPromise = runAfter(
        () => concatEditorServer(),
        engineWithoutDomPromise,
        editorServerLibPromise
    )
    const editorClientPromise = runAfter(
        () => concatEditorClient(),
        enginePromise,
        editorServerLibPromise
    )
    await Promise.all([
        engineWithoutDomPromise,
        enginePromise,
        engineTestPromise,
        editorServerLibPromise,
        editorServerPromise,
        editorClientPromise,
    ])
}

async function concatEngineWithoutDom() {
    const files = ["node_modules/es6-promise/dist/es6-promise.auto.min.js"]
        .concat(
            glob
                .sync("build/tsjs/*.js")
                .filter((p) => p !== "build/tsjs/defer.run.js")
        )
        .concat(["build/tsjs/engine/**/*.js"])
    return concatFilesWithSourceMaps(
        files,
        "build/engine-without-dom-libraries.js"
    )
}

async function concatEngine() {
    const files = [
        "node_modules/howler/dist/howler.min.js",
        "build/engine-without-dom-libraries.js",
    ]
    return concatFilesWithSourceMaps(files, "build/engine.js")
}

async function concatEngineTest() {
    const files = [
        "build/engine-without-dom-libraries.js",
        "build/tsjs/test-runner/**/*.js",
        "build/tsjs/engine-test/**/*.js",
        "build/tsjs/defer.run.js",
    ]
    return concatFilesWithSourceMaps(files, "build/engine-test.js")
}

async function concatEditorServerLib() {
    const files = glob
        .sync("build/tsjs/editor/server/**/*.js")
        .filter((p) => p !== "build/tsjs/editor/server/main.js")
    return concatFilesWithSourceMaps(files, "build/editor-server-lib.js")
}

async function concatEditorServer() {
    const files = [
        "build/engine-without-dom-libraries.js",
        "build/editor-server-lib.js",
        "build/tsjs/editor/server/main.js",
        "build/tsjs/defer.run.js",
    ]
    return concatFilesWithSourceMaps(files, "build/editor-server.js")
}

async function concatEditorClient() {
    const files = [
        "build/engine.js",
        "build/editor-server-lib.js",
        "build/tsjs/editor/client/**/*.js",
        // 'build/tsjs/editor/client/test.js',
        "build/tsjs/defer.run.js",
    ]
    return concatFilesWithSourceMaps(files, "build/editor-client.js")
}
