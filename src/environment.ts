// These values should be treated as constants to allow for conditional compilation etc.

const __DOM__ = typeof window !== "undefined" && typeof document !== "undefined"
const __NODE__ = typeof process !== "undefined"

// This is only available in a Web Worker
declare function importScripts(...urls: string[]): void
const __WORKER__ = typeof importScripts === 'function'

if(__NODE__) {
    require('source-map-support').install();
}