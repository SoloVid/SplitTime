namespace splitTime.menu {
    export class Menu {
        private currentPoint: int = 0
        constructor(
            private readonly spec: MenuSpec,
            private readonly view: ui.View,
            private readonly controls: MenuControls,
            private readonly hud: ui.HUD
        ) {}

        run(): PromiseLike<void> {
            this.currentPoint = 0
            var isRunning = true

            this.hud.pushRenderer(this)

            var promise = new splitTime.Pledge()
            this.controls.confirmButton.waitForAfterUp().then(() => {
                isRunning = false
                this.hud.removeRenderer(this)

                // Run handler for point selected
                this.spec.point[this.currentPoint].handler()

                promise.resolve()
            })

            this.controls.joyStick.onTilt(() => {
                if (!isRunning) {
                    return splitTime.STOP_CALLBACKS
                }
                this.handleMenu()
                return
            })

            return promise
        }

        // TODO: potentially split up into logic and rendering
        render() {
            // this.handleMenu();

            //Draw splitTime.Menu background
            if (this.spec.background) {
                this.view.see.drawImage(
                    G.ASSETS.images.get(this.spec.background),
                    0,
                    0
                )
            }
            //Draw cursor
            if (this.spec.cursor) {
                this.view.see.drawImage(
                    G.ASSETS.images.get(this.spec.cursor),
                    this.spec.point[this.currentPoint].x,
                    this.spec.point[this.currentPoint].y
                )
            }
        }

        handleMenu() {
            // TODO: improve implementation
            /*This menu system navigates on a grid even though points are listed linearly.
			Basically, the code finds the closest point (in the direction of the key press)
			to the current point that is within a 90 degree viewing angle from the point in that direction.*/

            var controlDirection = splitTime.direction.simplifyToCardinal(
                this.controls.joyStick.getDirection()
            )

            var prevPoint = this.currentPoint
            var iPoint = prevPoint
            var bestPoint = iPoint
            var dxBest = 1000 //Distance from prevPoint to bestPoint
            var dyBest = 1000
            var isUnderUpperBound, isAboveLowerBound
            var dxTest, dyTest, setNewBest
            if (controlDirection === splitTime.direction.W) {
                //Left
                do //While index point does not equal original point
                {
                    var isLeft =
                        this.spec.point[iPoint].x < this.spec.point[prevPoint].x
                    if (isLeft) {
                        isUnderUpperBound =
                            this.spec.point[iPoint].y <=
                            -this.spec.point[iPoint].x +
                                this.spec.point[prevPoint].x +
                                this.spec.point[prevPoint].y
                        isAboveLowerBound =
                            this.spec.point[iPoint].y >=
                            this.spec.point[iPoint].x -
                                this.spec.point[prevPoint].x +
                                this.spec.point[prevPoint].y
                    } else {
                        isUnderUpperBound =
                            this.spec.point[iPoint].y <=
                            -this.spec.point[iPoint].x +
                                (this.spec.point[prevPoint].x +
                                    this.view.width) +
                                this.spec.point[prevPoint].y
                        isAboveLowerBound =
                            this.spec.point[iPoint].y >=
                            this.spec.point[iPoint].x -
                                (this.spec.point[prevPoint].x +
                                    this.view.width) +
                                this.spec.point[prevPoint].y
                    }
                    if (isUnderUpperBound && isAboveLowerBound) {
                        //Point within 90 degree viewing window
                        dxTest =
                            this.spec.point[prevPoint].x -
                            this.spec.point[iPoint].x
                        if (!isLeft) dxTest += this.view.width
                        dyTest = Math.abs(
                            this.spec.point[prevPoint].y -
                                this.spec.point[iPoint].y
                        )
                        if (dxTest <= dxBest) {
                            setNewBest = !(dxTest == dxBest && dyTest > dyBest)
                            if (setNewBest) {
                                dxBest = dxTest
                                dyBest = dyTest
                                bestPoint = iPoint
                            }
                        }
                    }
                    iPoint =
                        (this.spec.point.length + iPoint - 1) %
                        this.spec.point.length
                } while (iPoint != prevPoint)
                this.currentPoint = bestPoint
            } else if (controlDirection === splitTime.direction.N) {
                //Up
                do //While index point does not equal original point
                {
                    var isUp =
                        this.spec.point[iPoint].y < this.spec.point[prevPoint].y
                    if (isUp) {
                        isAboveLowerBound =
                            this.spec.point[iPoint].x <=
                            -this.spec.point[iPoint].y +
                                this.spec.point[prevPoint].y +
                                this.spec.point[prevPoint].x
                        isUnderUpperBound =
                            this.spec.point[iPoint].x >=
                            this.spec.point[iPoint].y -
                                this.spec.point[prevPoint].y +
                                this.spec.point[prevPoint].x
                    } else {
                        isAboveLowerBound =
                            this.spec.point[iPoint].x <=
                            -this.spec.point[iPoint].y +
                                (this.spec.point[prevPoint].y +
                                    this.view.height) +
                                this.spec.point[prevPoint].x
                        isUnderUpperBound =
                            this.spec.point[iPoint].x >=
                            this.spec.point[iPoint].y -
                                (this.spec.point[prevPoint].y +
                                    this.view.height) +
                                this.spec.point[prevPoint].x
                    }
                    if (isUnderUpperBound && isAboveLowerBound) {
                        //Point within 90 degree viewing window
                        dyTest =
                            this.spec.point[prevPoint].y -
                            this.spec.point[iPoint].y
                        if (!isUp) dyTest += this.view.height
                        dxTest = Math.abs(
                            this.spec.point[prevPoint].x -
                                this.spec.point[iPoint].x
                        )
                        if (dyTest <= dyBest) {
                            setNewBest = !(dyTest == dyBest && dxTest > dxBest)
                            if (setNewBest) {
                                dxBest = dxTest
                                dyBest = dyTest
                                bestPoint = iPoint
                            }
                        }
                    }
                    iPoint =
                        (this.spec.point.length + iPoint - 1) %
                        this.spec.point.length
                } while (iPoint != prevPoint)
                this.currentPoint = bestPoint
                //		this.currentPoint = (this.spec.point.length + this.currentPoint - 1)%this.spec.point.length;
            } else if (controlDirection === splitTime.direction.E) {
                //Right
                do //While index point does not equal original point
                {
                    var isRight =
                        this.spec.point[iPoint].x > this.spec.point[prevPoint].x
                    if (isRight) {
                        isUnderUpperBound =
                            this.spec.point[iPoint].y >=
                            -this.spec.point[iPoint].x +
                                this.spec.point[prevPoint].x +
                                this.spec.point[prevPoint].y
                        isAboveLowerBound =
                            this.spec.point[iPoint].y <=
                            this.spec.point[iPoint].x -
                                this.spec.point[prevPoint].x +
                                this.spec.point[prevPoint].y
                    } else {
                        isUnderUpperBound =
                            this.spec.point[iPoint].y >=
                            -this.spec.point[iPoint].x +
                                (this.spec.point[prevPoint].x -
                                    this.view.width) +
                                this.spec.point[prevPoint].y
                        isAboveLowerBound =
                            this.spec.point[iPoint].y <=
                            this.spec.point[iPoint].x -
                                (this.spec.point[prevPoint].x -
                                    this.view.width) +
                                this.spec.point[prevPoint].y
                    }
                    if (isUnderUpperBound && isAboveLowerBound) {
                        //Point within 90 degree viewing window
                        dxTest =
                            this.spec.point[iPoint].x -
                            this.spec.point[prevPoint].x
                        if (!isRight) dxTest += this.view.width
                        dyTest = Math.abs(
                            this.spec.point[prevPoint].y -
                                this.spec.point[iPoint].y
                        )
                        if (dxTest <= dxBest) {
                            setNewBest = !(dxTest == dxBest && dyTest > dyBest)
                            if (setNewBest) {
                                dxBest = dxTest
                                dyBest = dyTest
                                bestPoint = iPoint
                            }
                        }
                    }
                    iPoint = (iPoint + 1) % this.spec.point.length
                } while (iPoint != prevPoint)
                this.currentPoint = bestPoint
                //this.currentPoint = (this.currentPoint + 1)%this.spec.point.length;
            } else if (controlDirection === splitTime.direction.S) {
                //Down
                do //While index point does not equal original point
                {
                    var isDown =
                        this.spec.point[iPoint].y > this.spec.point[prevPoint].y
                    if (isDown) {
                        isUnderUpperBound =
                            this.spec.point[iPoint].x >=
                            -this.spec.point[iPoint].y +
                                this.spec.point[prevPoint].y +
                                this.spec.point[prevPoint].x
                        isAboveLowerBound =
                            this.spec.point[iPoint].x <=
                            this.spec.point[iPoint].y -
                                this.spec.point[prevPoint].y +
                                this.spec.point[prevPoint].x
                    } else {
                        isUnderUpperBound =
                            this.spec.point[iPoint].x >=
                            -this.spec.point[iPoint].y +
                                (this.spec.point[prevPoint].y -
                                    this.view.height) +
                                this.spec.point[prevPoint].x
                        isAboveLowerBound =
                            this.spec.point[iPoint].x <=
                            this.spec.point[iPoint].y -
                                (this.spec.point[prevPoint].y -
                                    this.view.height) +
                                this.spec.point[prevPoint].x
                    }
                    if (isUnderUpperBound && isAboveLowerBound) {
                        //Point within 90 degree viewing window
                        dyTest =
                            this.spec.point[iPoint].y -
                            this.spec.point[prevPoint].y
                        if (!isDown) dyTest += this.view.height
                        dxTest = Math.abs(
                            this.spec.point[prevPoint].x -
                                this.spec.point[iPoint].x
                        )
                        if (dyTest <= dyBest) {
                            setNewBest = !(dyTest == dyBest && dxTest > dxBest)
                            if (setNewBest) {
                                dxBest = dxTest
                                dyBest = dyTest
                                bestPoint = iPoint
                            }
                        }
                    }
                    iPoint = (iPoint + 1) % this.spec.point.length
                } while (iPoint != prevPoint)
                this.currentPoint = bestPoint
                //		this.currentPoint = (this.currentPoint + 1)%this.spec.point.length;
            }
        }
    }
}
