namespace splitTime.debug {
    export var ENABLED = true // Master switch
    export var DRAW_TRACES = false

    var debugDiv: HTMLElement | null = null
    var debugInfo: { [key: string]: DebugValue } = {}

    var DEBOUNCE = 100
    var LIFE = 2000
    var frameStabilizer: FrameStabilizer

    export function attachDebug(parent: HTMLElement) {
        debugDiv = document.createElement("div")
        parent.appendChild(debugDiv)
        frameStabilizer = new splitTime.FrameStabilizer(DEBOUNCE)
    }

    export function setDebugValue(key: string, value: unknown) {
        if (!splitTime.debug.ENABLED) {
            return
        }

        if (!debugInfo[key]) {
            debugInfo[key] = new DebugValue(key)
        }
        debugInfo[key].value = value
        debugInfo[key].timeUpdated = new Date().getTime()
    }

    export function update() {
        var keys = []
        for (let key in debugInfo) {
            keys.push(key)
        }
        for (var i = 0; i < keys.length; i++) {
            let key = keys[i]
            var debugValue = debugInfo[key]
            if (new Date().getTime() - debugValue.timeUpdated > LIFE) {
                delete debugInfo[key]
            }
        }
    }

    export function renderHTML() {
        if (debugDiv === null || !frameStabilizer.isSignaling()) {
            return
        }

        var table = "<table border='1'>"
        table += "<tr>"
        for (var key in debugInfo) {
            table += "<th>" + key + "</th>"
        }
        table += "</tr><tr>"
        for (key in debugInfo) {
            table += "<td>" + debugInfo[key].value + "</td>"
        }
        table += "</tr>"
        table += "</table>"

        debugDiv.innerHTML = table
    }

    export function renderCanvas(view: ui.View) {
        var FONT_SIZE = 16
        var SPACING = 5
        view.see.textBaseline = "alphabetic"
        view.see.font = FONT_SIZE + "px monospace"

        const lines: string[] = []
        let width = 0
        let height = 0
        for (var key in debugInfo) {
            var line = key + ": " + debugInfo[key].value
            lines.push(line)
            const metrics = view.see.measureText(line)
            width = Math.max(width, metrics.width + 2 * SPACING)
            height += FONT_SIZE + SPACING
        }
        view.see.fillStyle = "rgba(100, 100, 100, 0.4)"
        view.see.fillRect(0, view.height - height, width, height)

        view.see.fillStyle = "#FFFFFF"
        var y = view.height - height + (2 * SPACING + FONT_SIZE / 2)
        for (const line of lines) {
            view.see.fillText(line, SPACING, y)
            y += FONT_SIZE + SPACING
        }
    }

    class DebugValue {
        value: unknown = null
        timeUpdated: number = 0
        constructor(public readonly key: string) {}
    }
}
