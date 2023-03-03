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
        // console.log(`start perm ${inputRefOrder}`)
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
        // console.log(`end perm`)
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

function makeLargeDrawable(): GraphDrawable {
  return {
    getCanvasRequirements(): CanvasRequirements {
      return new CanvasRequirements(
        Rect.make(-4 * cubit, -4 * cubit, 8 * cubit, 8 * cubit)
      )
    }
  }
}

// Adapted from https://stackoverflow.com/a/20871714/4639640
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

sortingTest("Non-overlapping bodies should not create cycle", go => {
  // In this scenario, backTop clearly needs to be rendered after backBottom
  // since they are stacked.
  // However, backTop and front are both arguably "in front" of the other.
  // They don't really need to be ordered in this scenario.
  const backTop = makeGraphBody({ y: -2 * cubit, z: cubit })
  const backBottom = makeGraphBody({ y: -2 * cubit, z: 0 })
  const front = makeGraphBody({ y: 0, z: 0,
    drawables: [makeLargeDrawable()]
  })
  go({
    inputBodies: [backTop, backBottom, front],
    expectedOrdering: [backBottom, backTop, front]
  })
})

levelTracesTests.scenario("Graph should function properly over multiple iterations", t => {
  // These positions are listed in order from back to front.
  const positions = [
    // This position should trigger a "soft before" ordering.
    { y: 0, z: 2 * cubit, drawables: [makeLargeDrawable()] },
    { y: cubit * 1, z: 0, drawables: [makeDrawable()] },
    { y: cubit * 2, z: 0, drawables: [makeDrawable()] },
  ]
  const bodies = [
    makeGraphBody({}),
    makeGraphBody({}),
    makeGraphBody({}),
  ]
  // console.log(`Bodies: ${JSON.stringify(bodies.map(b => b.ref))}`)

  const graph = new BodyRenderingGraph()

  function checkOrder(expectedOrdering: readonly GraphBody[]) {
    graph.notifyNewFrame()

    for (const b of bodies) {
      graph.feedBody(b)
    }
    
    graph.rebuildGraph()
    const walkedOrder: GraphBody[] = []
    graph.walk((node) => {
      walkedOrder.push(node.body)
    })
    const expectedRefOrder = expectedOrdering.map(b => b.ref).join(",")
    const actualRefOrder = walkedOrder.map(b => b.ref).join(",")
    t.assertEqual(expectedRefOrder, actualRefOrder, "Order should match")
  }

  // Go through everything a multiple times.
  for (let round = 0; round < 4; round++) {
    // Permute the order.
    // `bodyOrder` is an array of indexes into `bodies`,
    // with the sequence representing the draw order.
    // [2, 0, 1] indicates that the render order should be bodies[2], bodies[0], bodies[1].
    for (const bodyOrder of permute([0, 1, 2])) {
      // console.log(`bodyOrder ${JSON.stringify(bodyOrder)} (${JSON.stringify(bodyOrder.map(i => bodies[i].ref))})`)
      // "Move" each body to a new position per the current permutation.
      bodyOrder.forEach((bodyIndex, positionIndex) => {
        Object.assign(bodies[bodyIndex], positions[positionIndex])
        const b = bodies[bodyIndex]
        // console.log(`body ${b.ref} now at ${b.x}, ${b.y}, ${b.z}`)
      })
      checkOrder(
        // The order of the bodies should match the order of the position indexes.
        bodyOrder.map(i => bodies[i]),
      )
    }
  }
})
