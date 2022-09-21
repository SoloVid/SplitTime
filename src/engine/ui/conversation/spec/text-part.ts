import { Configuration } from "../../../splitTime.conversation"
import { Canvas } from "../../viewport/canvas"

export interface TextPart {
    text: string
    /** Options applied in order. */
    options?: readonly Readonly<TextPartOptions>[]
}

export interface TextPartOptions {
    font?: string
    fontSize?: number
    color?: string
}

export const getDefaultTextPartOptions = () => ({
    font: Configuration.FONT,
    fontSize: Configuration.FONT_SIZE,
    color: Configuration.TEXT_COLOR,
})

export function getTextPartOptions(part: Readonly<TextPart>): Required<TextPartOptions> {
    const options = part.options ?? []
    return options.reduce((soFar: Required<TextPartOptions>, o) => ({...soFar, ...o}), getDefaultTextPartOptions())
}

let c: Canvas | null = null
export function measureTextPart(part: Readonly<TextPart>, partialText?: string): {width: number, height: number} {
    const { font, fontSize } = getTextPartOptions(part)
    c ??= new Canvas(1, 1)
    c.context.font = fontSize + "px " + font
    return {
        width: c.context.measureText(partialText ?? part.text).width,
        height: fontSize
    }
}
