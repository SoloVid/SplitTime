namespace SplitTime.BoardRenderer {
    
    /**
    * Cached screen coordinates
    */
    var screen: { x: number; y: number; };
    
    var SCREEN_WIDTH: int;
    var SCREEN_HEIGHT: int;
    
    var buffer: SLVD.Canvas;
    var snapshot: SLVD.Canvas;
    
    var actualFocusPoint: { x: number; y: number; z: number; } = {
        x: 0,
        y: 0,
        z: 0
    };
    
    var currentLevel: SplitTime.Level | null = null;
    
    /** @type {{x: number, y: number, z: number}[]} */
    var focusPoints: { x: number; y: number; z: number; }[] = [];
    
    export function focusCameraOnPlayerBody() {
        if(SplitTime.playerBody) {
            SplitTime.BoardRenderer.setFocusPoint(SplitTime.playerBody);
        }
    };
    
    export function getFocusPoint() {
        return actualFocusPoint;
    }
    export function setFocusPoint(point: { x: number; y: number; z: number; }) {
        focusPoints = [point];
    }
    export function addFocusPoint(point: { x: number; y: number; z: number; }) {
        focusPoints.push(point);
    }
    export function removeFocusPoint(point: { x: number; y: number; z: number; }) {
        for(var i = 0; i < focusPoints.length; i++) {
            if(point === focusPoints[i]) {
                focusPoints.splice(i, 1);
                return;
            }
        }
    };
    
    export function getRelativeToScreen(thing: { x: number; y: number; z: number; }): { x: number; y: number; } {
        var screen = SplitTime.BoardRenderer.getScreenCoordinates();
        return {
            x: thing.x - screen.x,
            y: thing.y - screen.y - thing.z
        };
    };
    
    /**
    * Get the coordinates of the screen relative to the board (determined by the body in focus)
    */
    export function getScreenCoordinates(): { x: number; y: number; } {
        var screen = {
            // fallback case if focused body is close to close edge of board
            x: 0,
            y: 0
        };
        
        var currentLevel = SplitTime.Level.getCurrent();
        var focusPoint = SplitTime.BoardRenderer.getFocusPoint();
        var focusPoint2D = {
            x: focusPoint.x,
            y: focusPoint.y - focusPoint.z
        };
        
        if(currentLevel.width <= SCREEN_WIDTH) {
            // If the board is smaller than the screen, screen edge is at negative position
            screen.x = (currentLevel.width - SCREEN_WIDTH) / 2;
        } else if(focusPoint2D.x + SCREEN_WIDTH / 2 >= currentLevel.width) {
            // If the focused body is close to the far edge of the board, screen edge is fixed
            screen.x = currentLevel.width - SCREEN_WIDTH;
        } else if(focusPoint2D.x >= SCREEN_WIDTH / 2) {
            // (dominant case) if the focused body is somewhere in the middle of the board
            screen.x = focusPoint2D.x - (SCREEN_WIDTH / 2);
        }
        
        if(currentLevel.height <= SCREEN_HEIGHT) {
            // If the board is smaller than the screen, screen edge is at negative position
            screen.y = (currentLevel.height - SCREEN_HEIGHT) / 2;
        } else if(focusPoint2D.y + SCREEN_HEIGHT / 2 >= currentLevel.height) {
            // If the focused body is close to the far edge of the board, screen edge is fixed
            screen.y = currentLevel.height - SCREEN_HEIGHT;
        } else if(focusPoint2D.y >= SCREEN_HEIGHT / 2) {
            // (dominant case) if the focused body is somewhere in the middle of the board
            screen.y = focusPoint2D.y - (SCREEN_HEIGHT / 2);
        }
        
        screen.x = Math.round(screen.x);
        screen.y = Math.round(screen.y);
        
        return screen;
    };
    
    export function countBodies() {
        var currentLevel = SplitTime.Level.getCurrent();
        if(!currentLevel) {
            return 0;
        }
        return currentLevel.getBodies().length;
    }
    
    var bodyRenderer: body.Renderer;
    defer(() => {
        bodyRenderer = new SplitTime.body.Renderer();
    });
    
    export var SCREEN_LAZY_FACTOR = 0.25;
    
    function getScreenMoveSpeed(dx: number) {
        var MAX_STEP = 100;
        var curveValue = Math.abs(Math.pow(dx / (MAX_STEP * SplitTime.BoardRenderer.SCREEN_LAZY_FACTOR), 2));
        return Math.min(curveValue + 0.4, MAX_STEP);
    }
    
    export function notifyFrameUpdate(delta: number) {
        var existingLevel = currentLevel;
        currentLevel = SplitTime.Level.getCurrent();
        
        var targetFocus = {
            x: 0,
            y: 0,
            z: 0
        };
        
        for(var i = 0; i < focusPoints.length; i++) {
            targetFocus.x += focusPoints[i].x / focusPoints.length;
            targetFocus.y += focusPoints[i].y / focusPoints.length;
            targetFocus.z += focusPoints[i].z / focusPoints.length;
        }
        
        if(currentLevel !== existingLevel) {
            actualFocusPoint = targetFocus;
        } else {
            actualFocusPoint.x = SLVD.approachValue(actualFocusPoint.x, targetFocus.x, getScreenMoveSpeed(targetFocus.x - actualFocusPoint.x));
            actualFocusPoint.y = SLVD.approachValue(actualFocusPoint.y, targetFocus.y, getScreenMoveSpeed(targetFocus.y - actualFocusPoint.y));
            actualFocusPoint.z = SLVD.approachValue(actualFocusPoint.z, targetFocus.z, getScreenMoveSpeed(targetFocus.z - actualFocusPoint.z));
        }
    }
    
    export function renderBoardState(forceCalculate: boolean) {
        if(!forceCalculate) {
            SplitTime.see.drawImage(snapshot.element, 0, 0);
            return;
        }

        if(!currentLevel) {
            throw new Error("currentLevel is not initialized");
        }

        var weatherRenderer = currentLevel.weatherRenderer;
        screen = SplitTime.BoardRenderer.getScreenCoordinates();
        
        //Black out screen (mainly for the case of board being smaller than the screen)
        buffer.context.fillStyle = "#000000";
        buffer.context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        bodyRenderer.notifyNewFrame(screen, snapshot.context);
        var bodies = currentLevel.getBodies();
        var lights = [];
        
        for(var iBody = 0; iBody < bodies.length; iBody++) {
            var body = bodies[iBody];
            bodyRenderer.feedBody(body);
            if(body.drawable) {
                if(typeof body.drawable.prepareForRender === "function") {
                    body.drawable.prepareForRender();
                }
            }
            if(body.shadow) {
                var shadow = new SplitTime.body.Shadow(body);
                shadow.prepareForRender();
                bodyRenderer.feedBody(shadow.shadowBody);
            }
            if(body.lightIntensity > 0) {
                lights.push(body);
            }
        }
        weatherRenderer.setLights(lights);
        
        //Rendering sequence
        // buffer.context.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        snapshot.context.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        // if(SplitTime.process == "TRPG")
        // {
        // 	//Draw blue range squares
        // 	if(index == SplitTime.cTeam[SplitTime.currentPlayer].z && SplitTime.cTeam[SplitTime.currentPlayer].squares)
        // 	{
        // 		for(second = 0; second < SplitTime.cTeam[SplitTime.currentPlayer].squares.length; second++)
        // 		{
        // 			SplitTime.see.fillStyle = "rgba(0, 100, 255, .5)";
        // 			SplitTime.see.fillRect(SplitTime.cTeam[SplitTime.currentPlayer].squares[second].x*32 - SplitTime.wX, SplitTime.cTeam[SplitTime.currentPlayer].squares[second].y*32 - SplitTime.wY, 32, 32);
        // 			//SplitTime.see.drawImage(SplitTime.image.get("blueSquare.png"), 0, 0, 32, 32, SplitTime.cTeam[SplitTime.currentPlayer].squares[second].x*32 - SplitTime.wX, SplitTime.cTeam[SplitTime.currentPlayer].squares[second].y*32 - SplitTime.wY, 32, 32);
        // 		}
        // 	}
        // }
        
        bodyRenderer.render();
        snapshot.context.globalAlpha = 1;
        
        //Work out details of smaller-than-screen dimensions
        var xBackShift, yBackShift;
        if(screen.x < 0) xBackShift = -screen.x;
        else xBackShift = 0;
        if(screen.y < 0) yBackShift = -screen.y;
        else yBackShift = 0;
        
        snapshot.context.globalCompositeOperation = "destination-over";
        
        if(currentLevel.getBackgroundImage()) {
            //Note: this single call on a perform test is a huge percentage of CPU usage.
            snapshot.context.drawImage(
                currentLevel.getBackgroundImage(),
                screen.x + xBackShift, screen.y + yBackShift,
                SCREEN_WIDTH - 2 * xBackShift, SCREEN_HEIGHT - 2 * yBackShift,
                xBackShift, yBackShift,
                SCREEN_WIDTH - 2 * xBackShift, SCREEN_HEIGHT - 2 * yBackShift
            );
        }
            
        snapshot.context.globalCompositeOperation = "source-over";
        
        if(SplitTime.debug.ENABLED && SplitTime.debug.DRAW_TRACES) {
            snapshot.context.globalAlpha = 0.5;
            snapshot.context.drawImage(
                currentLevel.getDebugTraceCanvas(),
                screen.x + xBackShift, screen.y + yBackShift,
                SCREEN_WIDTH - 2 * xBackShift, SCREEN_HEIGHT - 2 * yBackShift,
                xBackShift, yBackShift,
                SCREEN_WIDTH - 2 * xBackShift, SCREEN_HEIGHT - 2 * yBackShift
            );
            snapshot.context.globalAlpha = 1;
        }
                
        buffer.context.drawImage(snapshot.element, 0, 0);
        
        weatherRenderer.render(buffer.context);
        
        //Display current SplitTime.player stats
        // SplitTime.see.fillStyle="#FFFFFF";
        // SplitTime.see.font="12px Verdana";
        // SplitTime.see.fillText(SplitTime.player[SplitTime.currentPlayer].name + ": " + SplitTime.player[SplitTime.currentPlayer].hp + " HP | " + SplitTime.player[SplitTime.currentPlayer].strg + " Strength | " + SplitTime.player[SplitTime.currentPlayer].spd + " Agility", 10, 20);
        //
        // SplitTime.Timeline.renderClock(SplitTime.see); //in time.js
        
        //Save screen into snapshot
        SplitTime.see.drawImage(buffer.element, 0, 0);
        snapshot.context.drawImage(buffer.element, 0, 0);
        
        for(iBody = 0; iBody < bodies.length; iBody++) {
            var drawable = bodies[iBody].drawable;
            if(drawable && typeof drawable.cleanupAfterRender === "function") {
                drawable.cleanupAfterRender();
            }
            // TODO: maybe cleanup shadows?
        }
    }
    
    export function createCanvases(width: int, height: int) {
        SCREEN_WIDTH = width;
        SCREEN_HEIGHT = height;
        
        buffer = new SLVD.Canvas(width, height);
        snapshot = new SLVD.Canvas(width, height);
    }
}