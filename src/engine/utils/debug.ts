import { FrameStabilizer } from "engine/time/frame-stabilizer";
import { View } from "../ui/viewport/view";

export const defaultGroup: Record<string, unknown> = {}

export let ENABLED = true; // Master switch
export let groupDisplayed: unknown = defaultGroup;
export let DRAW_TRACES = false;
let debugDiv: HTMLElement | null = null;
const debugInfo: Map<unknown, {
    [key: string]: DebugValue;
}> = new Map();
const DEBOUNCE = 100;
const LIFE = 2000;
let frameStabilizer: FrameStabilizer;
export function attachDebug(parent: HTMLElement) {
    debugDiv = document.createElement("div");
    parent.appendChild(debugDiv);
    frameStabilizer = new FrameStabilizer(DEBOUNCE);
}
export function setDebugValue(group: unknown, key: string, value: unknown) {
    if (!ENABLED) {
        return;
    }
    let map = debugInfo.get(group);
    if (map === undefined) {
        map = {};
        debugInfo.set(group, map);
    }
    if (!map[key]) {
        map[key] = new DebugValue(key);
    }
    map[key].value = value;
    map[key].timeUpdated = performance.now();
}
export function update() {
    const map = debugInfo.get(groupDisplayed) ?? {};
    var keys = [];
    for (let key in map) {
        keys.push(key);
    }
    for (var i = 0; i < keys.length; i++) {
        let key = keys[i];
        var debugValue = map[key];
        if (performance.now() - debugValue.timeUpdated > LIFE) {
            delete map[key];
        }
    }
}
export function renderHTML() {
    if (debugDiv === null || !frameStabilizer.isSignaling()) {
        return;
    }
    const map = debugInfo.get(groupDisplayed) ?? {};
    var table = "<table border='1'>";
    table += "<tr>";
    for (var key in map) {
        table += "<th>" + key + "</th>";
    }
    table += "</tr><tr>";
    for (key in map) {
        table += "<td>" + map[key].value + "</td>";
    }
    table += "</tr>";
    table += "</table>";
    debugDiv.innerHTML = table;
}
export function renderCanvas(view: View) {
    const map = debugInfo.get(groupDisplayed) ?? {};
    var FONT_SIZE = 16;
    var SPACING = 5;
    view.see.raw.context.textBaseline = "alphabetic";
    view.see.raw.context.font = FONT_SIZE + "px monospace";
    const lines: string[] = [];
    let width = 0;
    let height = 0;
    for (var key in map) {
        var line = key + ": " + map[key].value;
        lines.push(line);
        const metrics = view.see.raw.context.measureText(line);
        width = Math.max(width, metrics.width + 2 * SPACING);
        height += FONT_SIZE + SPACING;
    }
    view.see.raw.context.fillStyle = "rgba(100, 100, 100, 0.4)";
    view.see.raw.context.fillRect(0, view.height - height, width, height);
    view.see.raw.context.fillStyle = "#FFFFFF";
    var y = view.height - height + (2 * SPACING + FONT_SIZE / 2);
    for (const line of lines) {
        view.see.raw.context.fillText(line, SPACING, y);
        y += FONT_SIZE + SPACING;
    }
}
class DebugValue {
    value: unknown = null;
    timeUpdated: number = 0;
    constructor(public readonly key: string) { }
}
