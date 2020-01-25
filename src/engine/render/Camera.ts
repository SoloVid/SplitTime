namespace SplitTime {
    type body_getter = () => Body | null;
    type level_getter = () => Level;

    export class Camera {
        public readonly SCREEN_WIDTH: int;
        public readonly SCREEN_HEIGHT: int;
        
        private actualFocusPoint: { x: number; y: number; z: number; } = {
            x: 0,
            y: 0,
            z: 0
        };

        private currentLevel: SplitTime.Level | null = null;

        /** @type {{x: number, y: number, z: number}[]} */
        private focusPoints: { x: number; y: number; z: number; }[] = [];
                
        constructor(width: int, height: int, private readonly playerBodyGetter: body_getter, private readonly currentLevelGetter: level_getter) {
            this.SCREEN_WIDTH = width;
            this.SCREEN_HEIGHT = height;
        }

        focusCameraOnPlayerBody() {
            const playerBody = this.playerBodyGetter();
            if(playerBody) {
                this.setFocusPoint(playerBody);
            }
        };
        
        getFocusPoint() {
            return this.actualFocusPoint;
        }
        setFocusPoint(point: { x: number; y: number; z: number; }) {
            this.focusPoints = [point];
        }
        addFocusPoint(point: { x: number; y: number; z: number; }) {
            this.focusPoints.push(point);
        }
        removeFocusPoint(point: { x: number; y: number; z: number; }) {
            for(var i = 0; i < this.focusPoints.length; i++) {
                if(point === this.focusPoints[i]) {
                    this.focusPoints.splice(i, 1);
                    return;
                }
            }
        };
        
        getRelativeToScreen(thing: { x: number; y: number; z: number; }): { x: number; y: number; } {
            var screen = this.getScreenCoordinates();
            return {
                x: thing.x - screen.x,
                y: thing.y - screen.y - thing.z
            };
        };
        
        /**
        * Get the coordinates of the screen relative to the board (determined by the body in focus)
        */
        getScreenCoordinates(): { x: number; y: number; } {
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
            
            if(currentLevel.width <= this.SCREEN_WIDTH) {
                // If the board is smaller than the screen, screen edge is at negative position
                screen.x = (currentLevel.width - this.SCREEN_WIDTH) / 2;
            } else if(focusPoint2D.x + this.SCREEN_WIDTH / 2 >= currentLevel.width) {
                // If the focused body is close to the far edge of the board, screen edge is fixed
                screen.x = currentLevel.width - this.SCREEN_WIDTH;
            } else if(focusPoint2D.x >= this.SCREEN_WIDTH / 2) {
                // (dominant case) if the focused body is somewhere in the middle of the board
                screen.x = focusPoint2D.x - (this.SCREEN_WIDTH / 2);
            }
            
            if(currentLevel.height <= this.SCREEN_HEIGHT) {
                // If the board is smaller than the screen, screen edge is at negative position
                screen.y = (currentLevel.height - this.SCREEN_HEIGHT) / 2;
            } else if(focusPoint2D.y + this.SCREEN_HEIGHT / 2 >= currentLevel.height) {
                // If the focused body is close to the far edge of the board, screen edge is fixed
                screen.y = currentLevel.height - this.SCREEN_HEIGHT;
            } else if(focusPoint2D.y >= this.SCREEN_HEIGHT / 2) {
                // (dominant case) if the focused body is somewhere in the middle of the board
                screen.y = focusPoint2D.y - (this.SCREEN_HEIGHT / 2);
            }
            
            screen.x = Math.round(screen.x);
            screen.y = Math.round(screen.y);
            
            return screen;
        };
        
        SCREEN_LAZY_FACTOR = 0.25;
        
        private getScreenMoveSpeed(dx: number) {
            var MAX_STEP = 100;
            var curveValue = Math.abs(Math.pow(dx / (MAX_STEP * this.SCREEN_LAZY_FACTOR), 2));
            return Math.min(curveValue + 0.4, MAX_STEP);
        }
        
        notifyFrameUpdate(delta: number) {
            var existingLevel = this.currentLevel;
            this.currentLevel = this.currentLevelGetter();
            
            var targetFocus = {
                x: 0,
                y: 0,
                z: 0
            };
            
            for(var i = 0; i < this.focusPoints.length; i++) {
                targetFocus.x += this.focusPoints[i].x / this.focusPoints.length;
                targetFocus.y += this.focusPoints[i].y / this.focusPoints.length;
                targetFocus.z += this.focusPoints[i].z / this.focusPoints.length;
            }
            
            if(this.currentLevel !== existingLevel) {
                this.actualFocusPoint = targetFocus;
            } else {
                this.actualFocusPoint.x = SLVD.approachValue(this.actualFocusPoint.x, targetFocus.x, this.getScreenMoveSpeed(targetFocus.x - this.actualFocusPoint.x));
                this.actualFocusPoint.y = SLVD.approachValue(this.actualFocusPoint.y, targetFocus.y, this.getScreenMoveSpeed(targetFocus.y - this.actualFocusPoint.y));
                this.actualFocusPoint.z = SLVD.approachValue(this.actualFocusPoint.z, targetFocus.z, this.getScreenMoveSpeed(targetFocus.z - this.actualFocusPoint.z));
            }
        }
    }
}