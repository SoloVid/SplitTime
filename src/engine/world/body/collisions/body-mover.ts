namespace splitTime.body {
    class BodyExt {
        bumped: boolean = false
        pushing: boolean = false
        sliding: boolean = false
        previousGroundBody: Body | null = null
        previousGroundTraceX: int = -1
        previousGroundTraceY: int = -1
        previousGroundTraceZ: int = -1
    }

    export class Mover {
        body: splitTime.Body
        bodyExt: any
        dir: any
        horizontal: collisions.Horizontal
        vertical: collisions.Vertical
        constructor(body: Body) {
            this.body = body
            this.bodyExt = new BodyExt()

            this.horizontal = new collisions.Horizontal(this)
            this.vertical = new collisions.Vertical(this)
        }

        static VERTICAL_FUDGE = 4

        /**
         * Zelda step with input direction
         */
        zeldaBump(distance: number, direction: number): boolean {
            this.ensureInRegion()
            //Prevent infinite recursion
            if (
                this.bodyExt.pushing ||
                (this.bodyExt.bumped && !this.bodyExt.sliding)
            ) {
                return false
            }
            this.bodyExt.bumped = true

            //Save direction
            var tDir = this.dir
            //Set direction
            this.dir = direction
            //Bump
            var moved = this.horizontal.zeldaStep(direction, distance)
            //Revert direction;
            this.dir = tDir

            this.bodyExt.bumped = false
            return moved > 0
        }

        /**
         * Check that body is in current region
         */
        ensureInRegion() {
            // TODO: maybe reimplement this?
            // if(this.body.getLevel().getRegion() !== splitTime.Region.getCurrent()) {
            //     throw new Error("Attempt to do zelda movement for body not in current region");
            // }
        }

        /**
         * Move the body along the Z-axis up to the specified (maxZ) number of pixels.
         * @param {number} maxDZ
         * @returns {number} Z pixels actually moved
         */
        zeldaVerticalBump(maxDZ: number): number {
            this.ensureInRegion()

            if (Math.abs(maxDZ) < 0.000001) {
                // do nothing
                return 0
            }
            if (maxDZ < 0 && this.body.z <= this.body.level.lowestLayerZ) {
                // do nothing
                return 0
            }

            return this.vertical.zeldaVerticalMove(maxDZ)
        }

        // move(dx: number, dy: number, dz: number) {
        //     this.ensureInRegion()
        //     const level = this.body.level

        //     const dxRounded = dx > 0 ? Math.ceil(dx) : Math.floor(dx)
        //     const adx = Math.abs(dxRounded)
        //     const dyRounded = dy > 0 ? Math.ceil(dy) : Math.floor(dy)
        //     const ady = Math.abs(dyRounded)
        //     const dzRounded = dz > 0 ? Math.ceil(dz) : Math.floor(dz)
        //     const adz = Math.abs(dzRounded)

        //     //-1 for negative movement on the axis, 1 for positive
        //     const iHat = (dx === 0 ? 0 : dxRounded / adx) as unitOrZero
        //     const jHat = (dy === 0 ? 0 : dyRounded / ady) as unitOrZero
        //     const kHat = (dz === 0 ? 0 : dzRounded / adz) as unitOrZero

        //     const maxIterations = adx + ady + adz
        //     let xPixelsRemaining = adx
        //     let yPixelsRemaining = ady
        //     let zPixelsRemaining = adz

        //     var outY = false
        //     var stoppedY = false
        //     var pixelsMovedY = 0

        //     var outX = false
        //     var stoppedX = false
        //     var pixelsMovedX = 0

        //     var oldX = this.mover.body.getX()
        //     var oldY = this.mover.body.getY()
        //     var oldRoundX = Math.floor(oldX)
        //     var oldRoundY = Math.floor(oldY)
        //     var roundX = oldRoundX
        //     var roundY = oldRoundY
        //     var currentZ = this.mover.body.getZ()

        //     var halfLength = this.mover.body.halfBaseLength

        //     var eventIdSet = {}
        //     var levelIdSet = {}
        //     for (var i = 0; i < maxIterations; i++) {
        //         if (xPixelsRemaining > 0) {
        //             var newRoundX = roundX + iHat

        //             //If the body is out of bounds on the x axis
        //             if (
        //                 newRoundX + halfLength >= level.width ||
        //                 newRoundX - halfLength < 0
        //             ) {
        //                 outX = true
        //             } else {
        //                 var xCollisionInfo = this.horizontalX.calculateXPixelCollisionWithStepUp(
        //                     roundX,
        //                     roundY,
        //                     currentZ,
        //                     iHat as unit
        //                 )
        //                 if (xCollisionInfo.blocked) {
        //                     stoppedX = true
        //                     if (xCollisionInfo.bodies.length > 0) {
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
        //                     roundX = newRoundX
        //                     currentZ = xCollisionInfo.adjustedZ
        //                     xPixelsRemaining--
        //                     pixelsMovedX++
        //                     addArrayToSet(xCollisionInfo.events, eventIdSet)
        //                     addArrayToSet(
        //                         xCollisionInfo.otherLevels,
        //                         levelIdSet
        //                     )
        //                 }
        //             }
        //         }

        //         if (yPixelsRemaining > 0) {
        //             var newRoundY = roundY + jHat
        //             //Check if out of bounds on the y axis
        //             if (
        //                 newRoundY + halfLength >= level.yWidth ||
        //                 newRoundY - halfLength < 0
        //             ) {
        //                 outY = true
        //             } else {
        //                 var yCollisionInfo = this.horizontalY.calculateYPixelCollisionWithStepUp(
        //                     roundX,
        //                     roundY,
        //                     currentZ,
        //                     jHat as unit
        //                 )
        //                 if (yCollisionInfo.blocked) {
        //                     stoppedY = true
        //                     if (yCollisionInfo.bodies.length > 0) {
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
        //                     roundY = newRoundY
        //                     currentZ = yCollisionInfo.adjustedZ
        //                     yPixelsRemaining--
        //                     pixelsMovedY++
        //                     addArrayToSet(yCollisionInfo.events, eventIdSet)
        //                     addArrayToSet(
        //                         yCollisionInfo.otherLevels,
        //                         levelIdSet
        //                     )
        //                 }
        //             }
        //         }
        //     }

        //     if (ady > 0 && pixelsMovedY > 0) {
        //         var roundYMoved = roundY - oldRoundY
        //         var newYFromSteps = oldY + roundYMoved
        //         // Subtract off any overshoot
        //         var actualNewY = newYFromSteps - (dyRounded - dy)
        //         this.mover.body.setY(actualNewY)
        //     }
        //     if (adx > 0 && pixelsMovedX > 0) {
        //         var roundXMoved = roundX - oldRoundX
        //         var newXFromSteps = oldX + roundXMoved
        //         // Subtract off any overshoot
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

        //     this.mover.body.level.runEventSet(eventIdSet, this.mover.body)
        //     this.mover.transportLevelIfApplicable(levelIdSet)

        //     return splitTime.measurement.distanceTrue(
        //         oldX,
        //         oldY,
        //         this.mover.body.getX(),
        //         this.mover.body.getY()
        //     )
        // }

        transportLevelIfApplicable(levelIdSet?: { [s: string]: boolean }) {
            // var id = null
            // for (var key in levelIdSet) {
            //     if (id !== null) {
            //         return
            //     }
            //     id = key
            // }
            // if (id === null) {
            //     return
            // }
            var transporter = new splitTime.body.Transporter(this.body)
            // transporter.transportLevelIfApplicable(id)
            transporter.transportLevelIfApplicable()
        }
    }
}
