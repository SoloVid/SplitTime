namespace splitTime.body.collisions {
    export interface BodyMoveProjection {
        parents: readonly BodyMoveProjection[]
        body: Body
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
        out: boolean
        stopped: boolean
        pixelsMoved: number
        old: number
        current: number
        /** Temporary variable for whatever you want. */
        // scratch: number
    }

    export function makeProjectionForBody(b: Body): BodyMoveProjection {
        return {
            parents: [],
            body: b,
            x: {
                out: false,
                stopped: false,
                pixelsMoved: 0,
                old: b.getX(),
                current: b.getX()
            },
            y: {
                out: false,
                stopped: false,
                pixelsMoved: 0,
                old: b.getY(),
                current: b.getY()
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

    export function doProjectionsOverlap(p1: BodyMoveProjection, p2: BodyMoveProjection): boolean {
        return isOverlap(Math.round(p1.x.current) - p1.body.width / 2, p1.body.width, Math.round(p2.x.current) - p2.body.width / 2, p2.body.width) &&
            isOverlap(Math.round(p1.y.current) - p1.body.depth / 2, p1.body.depth, Math.round(p2.y.current) - p2.body.depth / 2, p2.body.depth) &&
            isOverlap(Math.round(p1.z.current), p1.body.height, Math.round(p2.z.current), p2.body.height)
    }

    // export class Horizontal {
    //     horizontalX: HorizontalX
    //     horizontalY: HorizontalY
    //     sliding: Sliding
    //     constructor(private readonly mover: splitTime.body.Mover) {
    //         this.horizontalX = new HorizontalX(mover)
    //         this.horizontalY = new HorizontalY(mover)
    //         this.sliding = new Sliding(mover)
    //     }
        /**
         * Advances splitTime.Body up to maxDistance pixels as far as is legal.
         * Includes pushing other Bodys out of the way
         * @returns distance actually moved
         */
        // export function groupZeldaStep(
        //     mainBody: Body,
        //     bodies: readonly Body[],
        //     dir: number,
        //     maxDistance: number,
        //     withPush: boolean
        // ): number {
        //     const level = mainBody.level

        //     let dy = -maxDistance * Math.sin(dir * (Math.PI / 2)) //Total y distance to travel
        //     if (Math.abs(dy) < ZILCH) {
        //         dy = 0
        //     }
        //     const dyRounded = dy > 0 ? Math.ceil(dy) : Math.floor(dy)
        //     const ady = Math.abs(dyRounded)

        //     let dx = maxDistance * Math.cos(dir * (Math.PI / 2)) //Total x distance to travel
        //     if (Math.abs(dx) < ZILCH) {
        //         dx = 0
        //     }
        //     const dxRounded = dx > 0 ? Math.ceil(dx) : Math.floor(dx)
        //     const adx = Math.abs(dxRounded)

        //     //-1 for negative movement on the axis, 1 for positive
        //     const jHat = (dy === 0 ? 0 : dyRounded / ady) as unitOrZero
        //     const iHat = (dx === 0 ? 0 : dxRounded / adx) as unitOrZero

        //     const maxIterations = adx + ady
        //     let xPixelsRemaining = adx
        //     let yPixelsRemaining = ady

        //     const projections: readonly BodyMoveProjection[] = bodies.map(b => ({
        //         body: b,
        //         x: {
        //             out: false,
        //             stopped: false,
        //             pixelsMoved: 0,
        //             old: b.getX(),
        //             current: b.getX()
        //         },
        //         y: {
        //             out: false,
        //             stopped: false,
        //             pixelsMoved: 0,
        //             old: b.getY(),
        //             current: b.getY()
        //         },
        //         z: {
        //             old: b.getZ(),
        //             current: b.getZ()
        //         },
        //         halfWidth: b.width / 2,
        //         halfDepth: b.depth / 2,
        //         eventIdSet: {},
        //         mightMoveLevels: false,
        //     }))

        //     for (var i = 0; i < maxIterations; i++) {
        //         if (xPixelsRemaining > 0) {
        //             const newX = currentX + iHat

        //             //If the body is out of bounds on the x axis
        //             if (
        //                 (iHat > 0 && newX + halfWidth >= level.width) ||
        //                 (iHat < 0 && newX - halfWidth < 0)
        //             ) {
        //                 outX = true
        //             } else {
        //                 const xCollisionInfo = this.horizontalX.calculateXPixelCollisionWithStepUp(
        //                     level,
        //                     currentX,
        //                     currentY,
        //                     currentZ,
        //                     iHat as unit
        //                 )
        //                 if (xCollisionInfo.blocked) {
        //                     stoppedX = true
        //                     if (withPush && xCollisionInfo.bodies.length > 0) {
        //                         // Slow down when pushing
        //                         xPixelsRemaining--
        //                         this.tryPushOtherBodies(
        //                             xCollisionInfo.bodies,
        //                             dx > 0
        //                                 ? splitTime.direction.E
        //                                 : splitTime.direction.W
        //                         )
        //                     }
        //                 } else {
        //                     const dz = xCollisionInfo.adjustedZ - currentZ
        //                     currentX = newX
        //                     currentZ = xCollisionInfo.adjustedZ
        //                     xPixelsRemaining--
        //                     // Slow down when changing elevation
        //                     xPixelsRemaining -= Math.ceil(Math.abs(dz))
        //                     pixelsMovedX++
        //                     addArrayToSet(xCollisionInfo.events, eventIdSet)
        //                     if (trace.isPointerOffsetSignificant(xCollisionInfo.targetOffset, level)) {
        //                         mightMoveLevels = true
        //                     }
        //                 }
        //             }
        //         }

        //         if (yPixelsRemaining > 0) {
        //             const newY = currentY + jHat
        //             //Check if out of bounds on the y axis
        //             if (
        //                 (jHat > 0 && newY + halfDepth >= level.yWidth) ||
        //                 (jHat < 0 && newY - halfDepth < 0)
        //             ) {
        //                 outY = true
        //             } else {
        //                 const yCollisionInfo = this.horizontalY.calculateYPixelCollisionWithStepUp(
        //                     level,
        //                     currentX,
        //                     currentY,
        //                     currentZ,
        //                     jHat as unit
        //                 )
        //                 if (yCollisionInfo.blocked) {
        //                     stoppedY = true
        //                     if (withPush && yCollisionInfo.bodies.length > 0) {
        //                         // Slow down when pushing
        //                         yPixelsRemaining--
        //                         this.tryPushOtherBodies(
        //                             yCollisionInfo.bodies,
        //                             dy > 0
        //                                 ? splitTime.direction.S
        //                                 : splitTime.direction.N
        //                         )
        //                     }
        //                 } else {
        //                     const dz = yCollisionInfo.adjustedZ - currentZ
        //                     currentY = newY
        //                     currentZ = yCollisionInfo.adjustedZ
        //                     yPixelsRemaining--
        //                     // Slow down when changing elevation
        //                     yPixelsRemaining -= Math.ceil(Math.abs(dz))
        //                     pixelsMovedY++
        //                     addArrayToSet(yCollisionInfo.events, eventIdSet)
        //                     if (trace.isPointerOffsetSignificant(yCollisionInfo.targetOffset, level)) {
        //                         mightMoveLevels = true
        //                     }
        //                 }
        //             }
        //         }
        //     }

        //     if (ady > 0 && pixelsMovedY > 0) {
        //         var yMoved = currentY - oldY
        //         var newYFromSteps = oldY + yMoved
        //         // Subtract off overshoot
        //         var actualNewY = newYFromSteps - (dyRounded - dy)
        //         this.mover.body.setY(actualNewY)
        //     }
        //     if (adx > 0 && pixelsMovedX > 0) {
        //         var xMoved = currentX - oldX
        //         var newXFromSteps = oldX + xMoved
        //         // Subtract off overshoot
        //         var actualNewX = newXFromSteps - (dxRounded - dx)
        //         this.mover.body.setX(actualNewX)
        //     }
        //     this.mover.body.setZ(currentZ)

        //     //If stopped, help person out by sliding around corner
        //     var stopped = stoppedX || stoppedY
        //     var out = outX || outY
        //     if (
        //         stopped &&
        //         !out &&
        //         pixelsMovedX + pixelsMovedY < maxDistance / 2
        //     ) {
        //         this.sliding.zeldaSlide(maxDistance / 2)
        //     }

        //     this.mover.body.level.runEvents(Object.keys(eventIdSet), this.mover.body)
        //     if (mightMoveLevels) {
        //         this.mover.transportLevelIfApplicable()
        //     }

        //     return splitTime.measurement.distanceTrue(
        //         oldX,
        //         oldY,
        //         this.mover.body.getX(),
        //         this.mover.body.getY()
        //     )
        // }

        // tryPushOtherBodies(bodies: Body[], dir: number) {
        //     this.mover.bodyExt.pushing = true
        //     try {
        //         for (const body of bodies) {
        //             // TODO: should this be different speeds depending on some parameters?
        //             if (body.pushable) {
        //                 body.mover.zeldaBump(1, dir)
        //             }
        //         }
        //     } finally {
        //         this.mover.bodyExt.pushing = false
        //     }
        // }
}
