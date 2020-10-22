namespace splitTime.utils {
    const drawShapeTests = {}
    splitTime.test.group(drawShapeTests, "Shape Drawing Tests", utils)

    splitTime.test.scenario(drawShapeTests, "Validate colors", t => {
        const color = new light.Color(255, 100, 1)
        const colorString = color.toRgbaString()    
        t.assert(light.Color.isValidColor(colorString), "Should be a valid color: 255, 100, 1")
        
        t.assert(light.Color.isValidColor("invalidBlue"), "Should be invalid color: 'invalidBlue'")

        const whiteColor = new light.Color("white")
        t.assert(whiteColor.r == 255 && whiteColor.g == 255 && whiteColor.b == 255, "The color name 'white' should resolve to 255, 255, 255")
        
        const fuchsia = new light.Color("fuchsia")
        t.assert(fuchsia.r == 255 && fuchsia.g == 0 && fuchsia.b == 255, "The color name 'fuchsia' should resolve to 255, 0, 255")
    })

    splitTime.test.scenario(drawShapeTests, "Draw a square", t => {
        const points = [
            new Coordinates2D(10, 10),
            new Coordinates2D(10, 20),
            new Coordinates2D(20, 20),
            new Coordinates2D(20, 10),
            null
        ]

        const target = new splitTime.Canvas(30, 30)
        const buffer = new splitTime.Canvas(target.width, target.height)
        const color = new light.Color(255, 100, 1)        
        
        drawShapeOpaque(points, target.context, buffer, color.toRgbaString())

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
    splitTime.test.scenario(drawShapeTests, "Draw a triangle", t => {
        const points = [
            new Coordinates2D(10, 10),
            new Coordinates2D(20, 11),
            new Coordinates2D(13, 21),
            null
        ]

        const target = new splitTime.Canvas(30, 30)
        const buffer = new splitTime.Canvas(target.width, target.height)
        const color = new light.Color(255, 100, 1)

        drawShapeOpaque(points, target.context, buffer, color.toRgbaString())

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

    splitTime.test.scenario(drawShapeTests, "Draw non-filled shape", t => {
        const points = [
            new Coordinates2D(10, 19),
            new Coordinates2D(21, 12),
            new Coordinates2D(10, 11)
        ]

        const target = new splitTime.Canvas(30, 30)
        const buffer = new splitTime.Canvas(target.width, target.height)
        const color = new light.Color(255, 100, 1)

        drawShapeOpaque(points, target.context, buffer, color.toRgbaString())

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