namespace splitTime.trace {
    export const Type = {
        SOLID: "solid",
        STAIRS: "stairs",
        GROUND: "ground",
        EVENT: "event",
        PATH: "path",
        POINTER: "pointer",
        TRANSPORT: "transport",
        SEND: "send",
    }

    export const RColor = {
        SOLID: 255,
        EVENT: 100,
        POINTER: 20
    }
    export const typeToColor: { [type: string]: number[] } = {
        solid: [RColor.SOLID, 0, 0, 1],
        event: [RColor.EVENT, 0, 0, 1],
        path: [0, 0, 0, 1],
        stairs: [0, 255, 0, 1]
    }
    export const colorToType: { [colorString: string]: string } = {}

    export function getColor(type: string) {
        return "rgba(" + typeToColor[type].join(", ") + ")"
    }
    export function getType(r: number, g: number, b: number, a?: number) {
        if (a === undefined) {
            a = 1
        }
        return colorToType[r + "," + g + "," + b + "," + a]
    }

    export function getEventColor(id: number) {
        var b = id % 256
        var g = Math.floor(id / 256)
        return "rgba(" + RColor.EVENT + ", " + g + ", " + b + ", 1)"
    }

    export function getEventIdFromColor(r: number, g: number, b: number, a: number) {
        return b + 256 * g
    }

    export function getPointerColor(id: number) {
        var b = id % 256
        var g = Math.floor(id / 256)
        return "rgba(" + RColor.POINTER + ", " + g + ", " + b + ", 1)"
    }

    export function getPointerIdFromColor(
        r: number,
        g: number,
        b: number,
        a: number
    ) {
        return b + 256 * g
    }

    for (var color in typeToColor) {
        colorToType[typeToColor[color].join(",")] = color
    }
}