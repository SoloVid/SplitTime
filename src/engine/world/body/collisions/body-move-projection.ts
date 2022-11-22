import { int } from "globals"
import { isOverlap } from "../../../utils/misc"
import { Body } from "../body"
import { COLLISION_CALCULATOR } from "./collision-calculator"

export interface BodyMoveProjection {
    parents: readonly BodyMoveProjection[]
    body: Body
    deltasCalculated: boolean
    x: BodyMoveProjectionCoordinate
    y: BodyMoveProjectionCoordinate
    z: {
        old: number
        current: number
    }
    halfWidth: number
    halfDepth: number
    eventIdSet: { [id: string]: true }
    mightMoveLevels: boolean
}

interface BodyMoveProjectionCoordinate {
    delta: number
    stopped: boolean
    pixelsMoved: int
    old: number
    current: number
    target: number
}

export function makeProjectionForBody(b: Body): BodyMoveProjection {
    return {
        parents: [],
        body: b,
        deltasCalculated: false,
        x: {
            delta: 0,
            stopped: false,
            pixelsMoved: 0,
            old: b.getX(),
            current: b.getX(),
            target: b.getX(),
        },
        y: {
            delta: 0,
            stopped: false,
            pixelsMoved: 0,
            old: b.getY(),
            current: b.getY(),
            target: b.getY(),
        },
        z: {
            old: b.getZ(),
            current: b.getZ()
        },
        halfWidth: b.width / 2,
        halfDepth: b.depth / 2,
        eventIdSet: {},
        mightMoveLevels: false,
    }
}

export function fillInDeltas(p: BodyMoveProjection): void {
    if (p.deltasCalculated) {
        return
    }
    const bodiesBelow = COLLISION_CALCULATOR.calculateVolumeCollision(
        p.body.collisionMask,
        p.body.level,
        p.body.getLeft(),
        p.body.width,
        p.body.getTopY(),
        p.body.depth,
        p.body.z - 1,
        1
    ).bodies
    const parentDeltaSum = p.parents.reduce((sum, parent) => {
        fillInDeltas(parent)
        return [sum[0] + parent.x.delta, sum[1] + parent.y.delta] as const
    }, [0, 0] as readonly [x: number, y: number])
    p.x.delta = parentDeltaSum[0] / bodiesBelow.length
    p.x.target = p.x.old + p.x.delta
    p.y.delta = parentDeltaSum[1] / bodiesBelow.length
    p.y.target = p.y.old + p.y.delta
    p.deltasCalculated = true
}

export function doProjectionsOverlap(p1: BodyMoveProjection, p2: BodyMoveProjection): boolean {
    const doMasksAlign = 
        !!(p1.body.collisionMask.membership & p2.body.collisionMask.search) ||
        !!(p2.body.collisionMask.membership & p1.body.collisionMask.search)
    if (!doMasksAlign) {
        return false
    }

    return isOverlap(Math.round(p1.x.current) - p1.body.width / 2, p1.body.width, Math.round(p2.x.current) - p2.body.width / 2, p2.body.width) &&
        isOverlap(Math.round(p1.y.current) - p1.body.depth / 2, p1.body.depth, Math.round(p2.y.current) - p2.body.depth / 2, p2.body.depth) &&
        isOverlap(Math.round(p1.z.current), p1.body.height, Math.round(p2.z.current), p2.body.height)
}
