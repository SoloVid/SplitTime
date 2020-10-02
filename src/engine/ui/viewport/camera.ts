namespace splitTime {
    type LevelGetter = () => Level

    /**
     * This class tracks the position of the camera in the game world.
     */
    export class Camera {
        public readonly SCREEN_WIDTH: int
        public readonly SCREEN_HEIGHT: int

        private actualFocusPoint: Coordinates3D = {
            x: 0,
            y: 0,
            z: 0
        }

        private currentLevel: splitTime.Level | null = null

        private focusPoints: ILevelLocation2[] = []

        constructor(
            width: int,
            height: int,
            private readonly currentLevelGetter: LevelGetter
        ) {
            this.SCREEN_WIDTH = width
            this.SCREEN_HEIGHT = height
        }

        getFocusPoint() {
            return this.actualFocusPoint
        }
        setFocusPoint(point: ILevelLocation2) {
            this.focusPoints = [point]
        }
        addFocusPoint(point: ILevelLocation2) {
            this.focusPoints.push(point)
        }
        removeFocusPoint(point: ILevelLocation2) {
            for (var i = 0; i < this.focusPoints.length; i++) {
                if (point === this.focusPoints[i]) {
                    this.focusPoints.splice(i, 1)
                    return
                }
            }
        }

        getRelativeToScreen(thing: Coordinates3D): Coordinates2D {
            var screen = this.getScreenCoordinates()
            return {
                x: thing.x - screen.x,
                y: thing.y - screen.y - thing.z
            }
        }

        /**
         * Get the coordinates of the screen relative to the board (determined by the body in focus)
         */
        getScreenCoordinates(): Coordinates2D {
            var screen = {
                // fallback case if focused body is close to close edge of board
                x: 0,
                y: 0
            }

            var currentLevel = this.currentLevelGetter()
            var focusPoint = this.getFocusPoint()
            var focusPoint2D = {
                x: focusPoint.x,
                y: focusPoint.y - focusPoint.z
            }

            if (currentLevel.width <= this.SCREEN_WIDTH) {
                // If the board is smaller than the screen, screen edge is at negative position
                screen.x = (currentLevel.width - this.SCREEN_WIDTH) / 2
            } else if (
                focusPoint2D.x + this.SCREEN_WIDTH / 2 >=
                currentLevel.width
            ) {
                // If the focused body is close to the far edge of the board, screen edge is fixed
                screen.x = currentLevel.width - this.SCREEN_WIDTH
            } else if (focusPoint2D.x >= this.SCREEN_WIDTH / 2) {
                // (dominant case) if the focused body is somewhere in the middle of the board
                screen.x = focusPoint2D.x - this.SCREEN_WIDTH / 2
            }

            if (currentLevel.height <= this.SCREEN_HEIGHT) {
                // If the board is smaller than the screen, screen edge is at negative position
                screen.y = (currentLevel.height - this.SCREEN_HEIGHT) / 2
            } else if (
                focusPoint2D.y + this.SCREEN_HEIGHT / 2 >=
                currentLevel.height
            ) {
                // If the focused body is close to the far edge of the board, screen edge is fixed
                screen.y = currentLevel.height - this.SCREEN_HEIGHT
            } else if (focusPoint2D.y >= this.SCREEN_HEIGHT / 2) {
                // (dominant case) if the focused body is somewhere in the middle of the board
                screen.y = focusPoint2D.y - this.SCREEN_HEIGHT / 2
            }

            screen.x = Math.round(screen.x)
            screen.y = Math.round(screen.y)

            return screen
        }

        CAMERA_MIN_MOVE = 2
        SCREEN_LAZY_FACTOR = 0.5

        private getScreenMoveSpeed(dx: number) {
            var MAX_STEP = 100
            var curveValue = Math.abs(
                Math.pow(dx / (MAX_STEP * this.SCREEN_LAZY_FACTOR), 2)
            )
            return Math.max(Math.min(curveValue + 0.4, MAX_STEP), this.CAMERA_MIN_MOVE)
        }

        notifyFrameUpdate(delta: number) {
            var existingLevel = this.currentLevel
            this.currentLevel = this.currentLevelGetter()

            var targetFocus = {
                x: 0,
                y: 0,
                z: 0
            }

            let pointsChosen = 0
            for (var i = 0; i < this.focusPoints.length; i++) {
                if (this.focusPoints[i].level === this.currentLevel) {
                    pointsChosen++
                    targetFocus.x += this.focusPoints[i].x
                    targetFocus.y += this.focusPoints[i].y
                    targetFocus.z += this.focusPoints[i].z
                }
            }

            if (pointsChosen === 0) {
                // If we didn't have any points to focus on,
                // don't move camera
                return
            }

            targetFocus.x /= pointsChosen
            targetFocus.y /= pointsChosen
            targetFocus.z /= pointsChosen

            if (this.currentLevel !== existingLevel) {
                this.actualFocusPoint = targetFocus
            } else {
                this.actualFocusPoint.x = splitTime.approachValue(
                    this.actualFocusPoint.x,
                    targetFocus.x,
                    this.getScreenMoveSpeed(
                        targetFocus.x - this.actualFocusPoint.x
                    )
                )
                this.actualFocusPoint.y = splitTime.approachValue(
                    this.actualFocusPoint.y,
                    targetFocus.y,
                    this.getScreenMoveSpeed(
                        targetFocus.y - this.actualFocusPoint.y
                    )
                )
                this.actualFocusPoint.z = splitTime.approachValue(
                    this.actualFocusPoint.z,
                    targetFocus.z,
                    this.getScreenMoveSpeed(
                        targetFocus.z - this.actualFocusPoint.z
                    )
                )
            }
        }
    }
}
