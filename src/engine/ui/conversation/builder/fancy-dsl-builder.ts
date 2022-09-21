import { FancySetupFunc } from "../misc-types"
import { FancyDsl, FancyOptions } from "../spec/dsl"
import { TextPart } from "../spec/text-part"

export function buildFancyViaDsl(setup: string | FancySetupFunc): TextPart[] {
    if (typeof setup === "string") {
        return [{ text: setup }]
    }

    const contextOptions: FancyOptions[] = []
    const parts: TextPart[] = []
    const dsl: FancyDsl = {
        text: (str) => {
            parts.push({ text: str, options: [...contextOptions] })
        },
        styled: (options, lineOrSetup) => {
            if (typeof lineOrSetup === "string") {
                parts.push({ text: lineOrSetup, options: [...contextOptions, options]})
            } else {
                contextOptions.push(options)
                try {
                    lineOrSetup()
                } finally {
                    contextOptions.pop()
                }
            }
        }
    }
    setup(dsl)
    return parts
}
