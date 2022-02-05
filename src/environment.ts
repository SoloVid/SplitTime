// These values should be treated as constants to allow for conditional compilation etc.
export const __DOM__ = typeof window !== "undefined" && typeof document !== "undefined";
export const __NODE__ = false; // typeof process !== "undefined"
// This is only available in a Web Worker
declare function importScripts(...urls: string[]): void;
export const __WORKER__ = typeof importScripts === 'function';
// This is defined in editor/event-handlers.js
export const __EDITOR__ = __DOM__ && typeof ((window as any)["__EDITOR_CONSTANT__"]) !== "undefined";
