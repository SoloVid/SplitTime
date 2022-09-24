import { Canvas, Coordinates2D, light } from "../../engine/splitTime"
import { drawShapeOpaque } from "../../engine/utils/draw-shape"
import { __NODE__ } from "../../environment"
import { utils } from "./test-utils"

if (!__NODE__) {
    const drawShapeTests = utils.group("Shape Drawing Tests")

    drawShapeTests.scenario("Validate colors", t => {
        const color = new light.Color(255, 100, 1)
        const colorString = color.cssString
        t.assert(light.Color.isValidColor(colorString), "Should be a valid color: 255, 100, 1")

        t.assert(!light.Color.isValidColor("invalidBlue"), "Should be invalid color: 'invalidBlue'")

        var errString
        try{
            const invalidColor = new light.Color("invalidBlue")
        } catch (error) {
            errString = error
        }
        t.assert(!!errString, "Passing an invalid color name should throw an error.")

        const outOfBoundsColor = new light.Color(-1, 256, 3.5)
        const roundedColor = new light.Color(0, 255, 4)
        t.assertEqual(outOfBoundsColor.cssString, roundedColor.cssString, "Out-of-bounds or non-integer RGB values should be rounded to nearest valid RGB value.")

        const whiteColor = new light.Color("white")
        t.assertEqual(255, whiteColor.r, "The color name 'white' should have an R value of 255.")
        t.assertEqual(255, whiteColor.g, "The color name 'white' should have an G value of 255.")
        t.assertEqual(255, whiteColor.b, "The color name 'white' should have an B value of 255.")

        const fuchsia = new light.Color("fuchsia")
        t.assertEqual(255, fuchsia.r, "The color name 'fuchsia' should have an R value of 255.")
        t.assertEqual(0, fuchsia.g, "The color name 'fuchsia' should have an G value of 0.")
        t.assertEqual(255, fuchsia.b, "The color name 'fuchsia' should have an B value of 255.")
    })

    drawShapeTests.scenario("Draw a square", t => {
        const points = [
            new Coordinates2D(10, 10),
            new Coordinates2D(10, 20),
            new Coordinates2D(20, 20),
            new Coordinates2D(20, 10),
            null
        ]

        const target = new Canvas(30, 30)
        const buffer = new Canvas(target.width, target.height)
        const color = new light.Color(255, 100, 1)

        drawShapeOpaque(points, target.context, buffer, color.cssString)

        const outputData = target.context.getImageData(0, 0, target.width, target.height)

        for (let y = 0; y < 30; y++) {
            for (let x = 0; x < 30; x++) {
                const i = (y * outputData.width + x) * 4
                const r = outputData.data[i + 0]
                const g = outputData.data[i + 1]
                const b = outputData.data[i + 2]
                const a = outputData.data[i + 3]
                const coordsStr = "(" + x + ", " + y + ")"
                if (
                    (x < 10 || x > 20)
                    || (y < 10 || y > 20)
                ) {
                    t.assert(0 === r, "Should see no r color at " + coordsStr)
                    t.assert(0 === g, "Should see no g color at " + coordsStr)
                    t.assert(0 === b, "Should see no b color at " + coordsStr)
                    t.assert(0 === a, "Should see no a color at " + coordsStr)
                } else {
                    t.assert(color.r === r, "Should see r color at " + coordsStr)
                    t.assert(color.g === g, "Should see g color at " + coordsStr)
                    t.assert(color.b === b, "Should see b color at " + coordsStr)
                    t.assert(255 === a, "Should see a color at " + coordsStr)
                }
            }
        }
    })

    // This case is primarily testing whether semi-transparent pixels get removed
    drawShapeTests.scenario("Draw a triangle", t => {
        const points = [
            new Coordinates2D(10, 10),
            new Coordinates2D(20, 11),
            new Coordinates2D(13, 21),
            null
        ]

        const target = new Canvas(30, 30)
        const buffer = new Canvas(target.width, target.height)
        const color = new light.Color(255, 100, 1)

        drawShapeOpaque(points, target.context, buffer, color.cssString)

        const outputData = target.context.getImageData(0, 0, target.width, target.height)

        for (let y = 0; y < 30; y++) {
            for (let x = 0; x < 30; x++) {
                const i = (y * outputData.width + x) * 4
                const r = outputData.data[i + 0]
                const g = outputData.data[i + 1]
                const b = outputData.data[i + 2]
                const a = outputData.data[i + 3]
                const coordsStr = "(" + x + ", " + y + ")"
                t.assert(a === 0 || a === 255, "Should be clear color at " + coordsStr)
                if (a === 0) {
                    t.assert(0 === r, "Should see no r color at " + coordsStr)
                    t.assert(0 === g, "Should see no g color at " + coordsStr)
                    t.assert(0 === b, "Should see no b color at " + coordsStr)
                } else {
                    t.assert(color.r === r, "Should see r color at " + coordsStr)
                    t.assert(color.g === g, "Should see g color at " + coordsStr)
                    t.assert(color.b === b, "Should see b color at " + coordsStr)
                }
            }
        }
    })

    drawShapeTests.scenario("Draw non-filled shape", t => {
        const points = [
            new Coordinates2D(10, 19),
            new Coordinates2D(21, 12),
            new Coordinates2D(10, 11)
        ]

        const target = new Canvas(30, 30)
        const buffer = new Canvas(target.width, target.height)
        const color = new light.Color(255, 100, 1)

        drawShapeOpaque(points, target.context, buffer, color.cssString)

        const outputData = target.context.getImageData(0, 0, target.width, target.height)

        for (let y = 0; y < 30; y++) {
            for (let x = 0; x < 30; x++) {
                const i = (y * outputData.width + x) * 4
                const r = outputData.data[i + 0]
                const g = outputData.data[i + 1]
                const b = outputData.data[i + 2]
                const a = outputData.data[i + 3]
                const coordsStr = "(" + x + ", " + y + ")"
                t.assert(a === 0 || a === 255, "Should be clear color at " + coordsStr)
                if (a === 0) {
                    t.assert(0 === r, "Should see no r color at " + coordsStr)
                    t.assert(0 === g, "Should see no g color at " + coordsStr)
                    t.assert(0 === b, "Should see no b color at " + coordsStr)
                } else {
                    t.assert(color.r === r, "Should see r color at " + coordsStr)
                    t.assert(color.g === g, "Should see g color at " + coordsStr)
                    t.assert(color.b === b, "Should see b color at " + coordsStr)
                }
            }
        }
    })
}
