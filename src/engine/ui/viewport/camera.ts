import { approachValue } from "engine/utils/misc";
import { Level } from "engine/world/level/level";
import { ILevelLocation2, Coordinates3D, Coordinates2D } from "engine/world/level/level-location";
import { int } from "globals";

type LevelGetter = () => Level;
/**
 * This class tracks the position of the camera in the game world.
 */
export class Camera {
    public readonly SCREEN_WIDTH: int;
    public readonly SCREEN_HEIGHT: int;
    private previousFocus: {
        target: ILevelLocation2;
        actual: Coordinates3D;
    } | null = null;
    private actualFocusPoint: Coordinates3D = {
        x: 0,
        y: 0,
        z: 0
    };
    private focusPoints: ILevelLocation2[] = [];
    constructor(width: int, height: int, private readonly currentLevelGetter: LevelGetter) {
        this.SCREEN_WIDTH = width;
        this.SCREEN_HEIGHT = height;
    }
    getFocusPoint() {
        return this.actualFocusPoint;
    }
    setFocusPoint(point: ILevelLocation2) {
        this.focusPoints = [point];
    }
    addFocusPoint(point: ILevelLocation2) {
        this.focusPoints.push(point);
    }
    removeFocusPoint(point: ILevelLocation2) {
        for (var i = 0; i < this.focusPoints.length; i++) {
            if (point === this.focusPoints[i]) {
                this.focusPoints.splice(i, 1);
                return;
            }
        }
    }
    getRelativeToScreen(thing: Coordinates3D): Coordinates2D {
        var screen = this.getScreenCoordinates();
        return {
            x: thing.x - screen.x,
            y: thing.y - screen.y - thing.z
        };
    }
    /**
     * Get the coordinates of the screen relative to the board (determined by the body in focus)
     */
    getScreenCoordinates(): Coordinates2D {
        var screen = {
            // fallback case if focused body is close to close edge of board
            x: 0,
            y: 0
        };
        var currentLevel = this.currentLevelGetter();
        var focusPoint = this.getFocusPoint();
        var focusPoint2D = {
            x: focusPoint.x,
            y: focusPoint.y - focusPoint.z
        };
        if (currentLevel.width <= this.SCREEN_WIDTH) {
            // If the board is smaller than the screen, screen edge is at negative position
            screen.x = (currentLevel.width - this.SCREEN_WIDTH) / 2;
        }
        else if (focusPoint2D.x + this.SCREEN_WIDTH / 2 >=
            currentLevel.width) {
            // If the focused body is close to the far edge of the board, screen edge is fixed
            screen.x = currentLevel.width - this.SCREEN_WIDTH;
        }
        else if (focusPoint2D.x >= this.SCREEN_WIDTH / 2) {
            // (dominant case) if the focused body is somewhere in the middle of the board
            screen.x = focusPoint2D.x - this.SCREEN_WIDTH / 2;
        }
        if (currentLevel.height <= this.SCREEN_HEIGHT) {
            // If the board is smaller than the screen, screen edge is at negative position
            screen.y = (currentLevel.height - this.SCREEN_HEIGHT) / 2;
        }
        else if (focusPoint2D.y + this.SCREEN_HEIGHT / 2 >=
            currentLevel.height) {
            // If the focused body is close to the far edge of the board, screen edge is fixed
            screen.y = currentLevel.height - this.SCREEN_HEIGHT;
        }
        else if (focusPoint2D.y >= this.SCREEN_HEIGHT / 2) {
            // (dominant case) if the focused body is somewhere in the middle of the board
            screen.y = focusPoint2D.y - this.SCREEN_HEIGHT / 2;
        }
        screen.x = Math.round(screen.x);
        screen.y = Math.round(screen.y);
        return screen;
    }
    CAMERA_MIN_MOVE = 8;
    SCREEN_LAZY_FACTOR = 0.5;
    private getScreenMoveSpeed(dx: number) {
        var MAX_STEP = 100;
        var curveValue = Math.abs(Math.pow(dx / (MAX_STEP * this.SCREEN_LAZY_FACTOR), 2));
        return Math.max(Math.min(curveValue + 0.4, MAX_STEP), this.CAMERA_MIN_MOVE);
    }
    notifyFrameUpdate(delta: number) {
        const currentLevel = this.currentLevelGetter();
        var targetFocus = {
            level: currentLevel,
            x: 0,
            y: 0,
            z: 0
        };
        let pointsChosen = 0;
        for (var i = 0; i < this.focusPoints.length; i++) {
            if (this.focusPoints[i].level === currentLevel) {
                pointsChosen++;
                targetFocus.x += this.focusPoints[i].x;
                targetFocus.y += this.focusPoints[i].y;
                targetFocus.z += this.focusPoints[i].z;
            }
        }
        if (pointsChosen === 0) {
            // If we didn't have any points to focus on,
            // don't move camera
            return;
        }
        targetFocus.x /= pointsChosen;
        targetFocus.y /= pointsChosen;
        targetFocus.z /= pointsChosen;
        if (this.previousFocus === null) {
            this.actualFocusPoint = targetFocus;
        }
        else if (currentLevel !== this.previousFocus.target.level) {
            const dx = targetFocus.x - this.previousFocus.target.x;
            const dy = targetFocus.y - this.previousFocus.target.y;
            const dz = targetFocus.z - this.previousFocus.target.z;
            const newFocus = new Coordinates3D(this.previousFocus.actual.x + dx, this.previousFocus.actual.y + dy, this.previousFocus.actual.z + dz);
            this.actualFocusPoint = newFocus;
        }
        else {
            const idealNew = new Coordinates3D();
            idealNew.x = approachValue(this.actualFocusPoint.x, targetFocus.x, this.getScreenMoveSpeed(targetFocus.x - this.actualFocusPoint.x));
            idealNew.y = approachValue(this.actualFocusPoint.y, targetFocus.y, this.getScreenMoveSpeed(targetFocus.y - this.actualFocusPoint.y));
            idealNew.z = approachValue(this.actualFocusPoint.z, targetFocus.z, this.getScreenMoveSpeed(targetFocus.z - this.actualFocusPoint.z));
            // Although the above logic looks smooth for the camera against the environment,
            // it (by itself) causes a jitter effect with the player image.
            // The camera coordinates and the sprite coordinates may be at a set offset
            // from each other when moving, but the rounded coordinates (used in rendering)
            // may still (and do) alternate between pixels because the switch from
            // round down to round up is slightly off.
            // Or in other words, as I move, the point at which the camera coordinates
            // snap over one for the next pixel and the point at which the player sprite
            // coordinates snap over one for the next pixel happen at different times,
            // such that the player sprite will appear to fall behind a pixel and then
            // catch up a pixel in rapid succession.
            // The result is that the player sprite looks like it jerks back and forth
            // (by 1 pixel) at a rapid rate.
            // This hack attempts to align the rounding of the two coordinates
            // by making sure that their fractional values (after the decimal point)
            // are always the same.
            const alignedNew = new Coordinates3D();
            alignedNew.x = this.imputeDecimal(idealNew.x, targetFocus.x);
            alignedNew.y = this.imputeDecimal(idealNew.y, targetFocus.y);
            alignedNew.z = this.imputeDecimal(idealNew.z, targetFocus.z);
            // Diagonal looks worse with the alignment adjustment, so don't use it in that case.
            if (this.actualFocusPoint.x !== alignedNew.x && this.actualFocusPoint.y !== alignedNew.y) {
                this.actualFocusPoint = idealNew;
            }
            else {
                this.actualFocusPoint = alignedNew;
            }
        }
        this.previousFocus = {
            target: targetFocus,
            actual: this.actualFocusPoint
        };
    }
    private imputeDecimal(me: number, informer: number): number {
        const fraction = informer % 1;
        // Add the integer part of me to the decimal part of informer
        return Math.round(me - fraction) + fraction;
    }
}
