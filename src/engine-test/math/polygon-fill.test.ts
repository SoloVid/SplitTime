import { math } from "./test-math"
import { Polygon } from "../../engine/math/polygon/polygon"
import { Vector2D } from "../../engine/math/vector2d"
import { int } from "../../globals"
import { fillPolygon } from "../../engine/math/polygon/polygon-fill"

math.scenario("fillPolygon() with square", t => {
    const square = new Polygon([
        new Vector2D(1, 1),
        new Vector2D(1, 3),
        new Vector2D(3, 3),
        new Vector2D(3, 1)
    ])

    // const dim = 5
    // const hits: boolean[] = []
    // hits.fill(false, 0, dim * dim)

    // fillPolygon(square, (x, y) => hits[y * dim + x] = true)

    // for (let i = 0; i < dim * dim; i++) {
    //     const x = i % dim
    //     const y = Math.floor(i / dim)
    //     if (x < 1 || x > 3 || y < 1 || y > 3) {
    //         t.assert(!hits[i], "The pixel at (" + x + ", " + y + ") should not have been drawn")
    //     } else {
    //         t.assert(hits[i], "The pixel at (" + x + ", " + y + ") should have been drawn")
    //     }
    // }

    testFillPolygon(square, 5, (x, y, isDrawn) => {
        if (x < 1 || x > 3 || y < 1 || y > 3) {
            t.assert(!isDrawn, msg(x, y, false))
        } else {
            t.assert(isDrawn, msg(x, y, true))
        }
    })
})

math.scenario("fillPolygon() with diamond", t => {
    const diamond = new Polygon([
        new Vector2D(1, 3),
        new Vector2D(3, 5),
        new Vector2D(5, 3),
        new Vector2D(3, 1)
    ])

    testFillPolygon(diamond, 7, (x, y, isDrawn) => {
        const bottomLeft = y < -x + 4
        const bottomRight = y < x - 2
        const topLeft = y > x + 2
        const topRight = y > -x + 8
        if (bottomLeft || bottomRight || topLeft || topRight) {
            t.assert(!isDrawn, msg(x, y, false))
        } else {
            t.assert(isDrawn, msg(x, y, true))
        }
    })
})

math.scenario("fillPolygon() with hourglass", t => {
    const hourglass = new Polygon([
        new Vector2D(1, 1),
        new Vector2D(3, 3),
        new Vector2D(1, 3),
        new Vector2D(3, 1)
    ])

    testFillPolygon(hourglass, 5, (x, y, isDrawn) => {
        const bottom = y === 0
        const top = y === 4
        const left = x === 0
        const right = x === 4
        const leftNotch = x === 1 && y === 2
        const rightNotch = x === 3 && y === 2
        if (bottom || top || left || right || leftNotch || rightNotch) {
            t.assert(!isDrawn, msg(x, y, false))
        } else {
            t.assert(isDrawn, msg(x, y, true))
        }
    })
})

function testFillPolygon(polygon: Polygon, dim: int, pixelCheck: (x: int, y: int, isDrawn: boolean) => void): void {
    const hits: boolean[] = []
    hits.fill(false, 0, dim * dim)

    fillPolygon(polygon, (x, y) => hits[y * dim + x] = true)

    // Uncomment this for some useful debugging graphics
    // let debugString = ""
    // for (let y = 0; y < dim; y++) {
    //     for (let x = 0; x < dim; x++) {
    //         const drawn = hits[y * dim + x]
    //         debugString += drawn ? "X" : "-"
    //     }
    //     debugString += "\n"
    // }
    // console.log(debugString)

    for (let i = 0; i < dim * dim; i++) {
        const x = i % dim
        const y = Math.floor(i / dim)
        pixelCheck(x, y, hits[i])
    }
}

function msg(x: int, y: int, shouldDraw: boolean): string {
    if (shouldDraw) {
        return "The pixel at (" + x + ", " + y + ") should have been drawn"
    }
    return "The pixel at (" + x + ", " + y + ") should not have been drawn"
}
