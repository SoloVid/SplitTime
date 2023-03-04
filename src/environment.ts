// These values should be treated as constants to allow for conditional compilation etc.
export const __DOM__ = typeof window !== "undefined" && typeof document !== "undefined";
export const __NODE__ = typeof process !== "undefined"
// This is only available in a Web Worker
declare function importScripts(...urls: string[]): void;
export const __WORKER__ = typeof importScripts === 'function';
// This is defined in editor.html
export const __EDITOR__ = __DOM__ && typeof ((window as any)["__EDITOR_CONSTANT__"]) !== "undefined";
// This is defined in player.html
export const __PLAYER__ = __DOM__ && typeof ((window as any)["__PLAYER_CONSTANT__"]) !== "undefined";
