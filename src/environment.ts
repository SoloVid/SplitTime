// These values should be treated as constants to allow for conditional compilation etc.

const __DOM__ = typeof window !== "undefined" && typeof document !== "undefined"
const __NODE__ = typeof process !== "undefined"

// This is only available in a Web Worker
declare function importScripts(...urls: string[]): void
const __WORKER__ = typeof importScripts === 'function'

// This is defined in editor/event-handlers.js
const __EDITOR__ = __DOM__ && typeof ((window as any)["__EDITOR_CONSTANT__"]) !== "undefined"

if(__NODE__) {
    require('source-map-support').install()
}