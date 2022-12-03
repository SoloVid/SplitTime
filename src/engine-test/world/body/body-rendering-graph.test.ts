import { getDefaultTopLeft } from "engine/graphics/frame"
import { Rect } from "engine/math/rect"
import { Body } from "engine/world/body/body"
import { BodyRenderingGraph, GraphBody, GraphDrawable } from "engine/world/body/body-rendering-graph"
import { CanvasRequirements, Drawable } from "engine/world/body/render/drawable"
import { test } from "under-the-sun"
import { body } from "./test-body"

const levelTracesTests = body.group("BodyRenderingGraph Tests")

type SortingTestOptions = {
  inputBodies: readonly GraphBody[]
  expectedOrdering: readonly GraphBody[]
}

function sortingTest(description: string, define: (go: (options: SortingTestOptions) => void) => void) {
  define((options) => {
    const expectedRefOrder = options.expectedOrdering.map(b => b.ref).join(",")

    const perms = permute(options.inputBodies)
  
    for (const inputPerm of perms) {
      const inputRefOrder = inputPerm.map(b => b.ref).join(",")
      levelTracesTests.scenario(`${description} (input order ${inputRefOrder})`, t => {
        const graph = new BodyRenderingGraph()
        graph.notifyNewFrame()
        for (const b of inputPerm) {
          graph.feedBody(b)
        }
        graph.rebuildGraph()
        const walkedOrder: GraphBody[] = []
        graph.walk((node) => {
          walkedOrder.push(node.body)
        })
        const actualRefOrder = walkedOrder.map(b => b.ref).join(",")
        t.assertEqual(expectedRefOrder, actualRefOrder, "Order should match")
      })
    }
  })
}

const cubit = 32
let nextRef = 1
function makeGraphBody(overrides: Partial<GraphBody>): GraphBody {
  return {
    ref: nextRef++,
    drawables: [makeDrawable()],
    x: cubit,
    y: cubit,
    z: cubit,
    width: cubit,
    depth: cubit,
    height: cubit,
    ...overrides,
  }
}

const defaultBodySpec = {
  width: cubit,
  depth: cubit,
  height: cubit,
}
function makeDrawable(): GraphDrawable {
  const topLeft = getDefaultTopLeft(defaultBodySpec, Rect.make(0, 0, 2 * cubit, 2 * cubit))
  const drawArea = Rect.make(topLeft.x, topLeft.y, cubit * 2, cubit * 2)
  return {
    getCanvasRequirements(): CanvasRequirements {
      return new CanvasRequirements(drawArea.copy())
    }
  }
}

// From https://stackoverflow.com/a/20871714/4639640
const permute = <T>(inputArr: readonly T[]): readonly (readonly T[])[] => {
  let result: T[][] = [];

  const permuteInner = (arr: readonly T[], m: T[] = []) => {
    if (arr.length === 0) {
      result.push(m)
    } else {
      for (let i = 0; i < arr.length; i++) {
        let curr = arr.slice();
        let next = curr.splice(i, 1);
        permuteInner(curr.slice(), m.concat(next))
      }
    }
  }

  permuteInner(inputArr)

  return result;
}

sortingTest("Two bodies should sort by y", go => {
  const frontBody = makeGraphBody({ y: cubit * 2 })
  const backBody = makeGraphBody({ y: cubit * 1 })
  go({
    inputBodies: [backBody, frontBody],
    expectedOrdering: [backBody, frontBody]
  })
})

sortingTest("Three bodies should sort by y", go => {
  const frontBody = makeGraphBody({ y: cubit * 3 })
  const middleBody = makeGraphBody({ y: cubit * 2 })
  const backBody = makeGraphBody({ y: cubit * 1 })
  go({
    inputBodies: [backBody, middleBody, frontBody],
    expectedOrdering: [backBody, middleBody, frontBody]
  })
})

sortingTest("Two bodies should sort by z", go => {
  const topBody = makeGraphBody({ z: cubit * 2 })
  const bottomBody = makeGraphBody({ z: cubit * 1 })
  go({
    inputBodies: [topBody, bottomBody],
    expectedOrdering: [bottomBody, topBody]
  })
})

sortingTest("Three bodies should sort by z", go => {
  const top = makeGraphBody({ z: cubit * 3 })
  const middle = makeGraphBody({ z: cubit * 2 })
  const bottom = makeGraphBody({ z: cubit * 1 })
  go({
    inputBodies: [top, middle, bottom],
    expectedOrdering: [bottom, middle, top]
  })
})

sortingTest("Overlapping bodies should sort by y", go => {
  const front = makeGraphBody({ y: cubit * 1.5, z: cubit * 1 })
  const top = makeGraphBody({ y: cubit * 1, z: cubit * 1.5 })
  go({
    inputBodies: [top, front],
    expectedOrdering: [top, front]
  })
})
