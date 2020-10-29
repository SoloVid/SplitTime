// These values should be treated as constants to allow for conditional compilation etc.

const __DOM__ = typeof window !== "undefined" && typeof document !== "undefined"
const __NODE__ = typeof process !== "undefined"
// Root of the Git repo (only available in Node)
declare const __ROOT__: string

// This is only available in a Web Worker
declare function importScripts(...urls: string[]): void
const __WORKER__ = typeof importScripts === 'function'

// This is defined in editor/event-handlers.js
const __EDITOR__ = __DOM__ && typeof ((window as any)["__EDITOR_CONSTANT__"]) !== "undefined"

if(__NODE__) {
    require('source-map-support').install()
}