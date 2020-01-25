namespace SplitTime.menu {


	export class Menu {
		point: {x: int, y: int}[];
		currentPoint: int = 0;
		background: CanvasImageSource | null = null;
		cursor: CanvasImageSource | null = null;
		constructor(private readonly view: player.View, private readonly controls: MenuControls) {
			this.point = [];
		};
		
		
		addPoint(x: int, y: int) {
			var index = this.point.length;
			this.point[index] = { x: x, y: y };
		};
		
		runMenu(hud?: HUD) {
			this.currentPoint = 0;
			var isRunning = true;
			
			if(hud) {
				hud.pushRenderer(this);
			}
			
			var promise = new SLVD.Promise();
			this.controls.confirmButton.waitForAfterUp().then(() => {
				isRunning = false;
				if(hud) {
					hud.removeRenderer(this);
				}
				promise.resolve(this.currentPoint);
			});
			
			this.controls.joyStick.onTilt(() => {
				if(!isRunning) {
					return SLVD.STOP_CALLBACKS;
				}
				this.handleMenu();
				return;
			});
			
			return promise;
		};
		
		resetPoints() {
			this.point.length = 0;
		};
		
		// Customizable function; run every frame
		update() {};
		
		// TODO: potentially split up into logic and rendering
		render() {
			// this.handleMenu();
			this.update();
			
			//Draw SplitTime.Menu background
			if(this.background) {
				this.view.see.drawImage(this.background, 0, 0);
			}
			//Draw cursor
			if(this.cursor) {
				this.view.see.drawImage(this.cursor, this.point[this.currentPoint].x, this.point[this.currentPoint].y);
			}
		}
		
		handleMenu() {
			// TODO: improve implementation
			/*This menu system navigates on a grid even though points are listed linearly.
			Basically, the code finds the closest point (in the direction of the key press)
			to the current point that is within a 90 degree viewing angle from the point in that direction.*/
			
			var controlDirection = SplitTime.Direction.simplifyToCardinal(this.controls.joyStick.getDirection());
			
			var prevPoint = this.currentPoint;
			var iPoint = prevPoint;
			var bestPoint = iPoint;
			var dxBest = 1000; //Distance from prevPoint to bestPoint
			var dyBest = 1000;
			var isUnderUpperBound, isAboveLowerBound;
			var dxTest, dyTest, setNewBest;
			if(controlDirection === SplitTime.Direction.W) //Left
			{
				do //While index point does not equal original point
				{
					var isLeft = this.point[iPoint].x < this.point[prevPoint].x;
					if(isLeft) {
						isUnderUpperBound = this.point[iPoint].y <= -this.point[iPoint].x + this.point[prevPoint].x + this.point[prevPoint].y;
						isAboveLowerBound = this.point[iPoint].y >= this.point[iPoint].x - this.point[prevPoint].x + this.point[prevPoint].y;
					} else {
						isUnderUpperBound = this.point[iPoint].y <= -this.point[iPoint].x + (this.point[prevPoint].x + this.view.width) + this.point[prevPoint].y;
						isAboveLowerBound = this.point[iPoint].y >= this.point[iPoint].x - (this.point[prevPoint].x + this.view.width) + this.point[prevPoint].y;
					}
					if(isUnderUpperBound && isAboveLowerBound) //Point within 90 degree viewing window
					{
						dxTest = this.point[prevPoint].x - this.point[iPoint].x;
						if(!isLeft) dxTest += this.view.width;
						dyTest = Math.abs(this.point[prevPoint].y - this.point[iPoint].y);
						if(dxTest <= dxBest) {
							setNewBest = !(dxTest == dxBest && dyTest > dyBest);
							if(setNewBest) {
								dxBest = dxTest;
								dyBest = dyTest;
								bestPoint = iPoint;
							}
						}
					}
					iPoint = (this.point.length + iPoint - 1)%this.point.length;
				} while(iPoint != prevPoint);
				this.currentPoint = bestPoint;
			}
			else if(controlDirection === SplitTime.Direction.N) //Up
			{
				do //While index point does not equal original point
				{
					var isUp = this.point[iPoint].y < this.point[prevPoint].y;
					if(isUp) {
						isAboveLowerBound = this.point[iPoint].x <= -this.point[iPoint].y + this.point[prevPoint].y + this.point[prevPoint].x;
						isUnderUpperBound = this.point[iPoint].x >= this.point[iPoint].y - this.point[prevPoint].y + this.point[prevPoint].x;
					} else {
						isAboveLowerBound = this.point[iPoint].x <= -this.point[iPoint].y + (this.point[prevPoint].y + this.view.height) + this.point[prevPoint].x;
						isUnderUpperBound = this.point[iPoint].x >= this.point[iPoint].y - (this.point[prevPoint].y + this.view.height) + this.point[prevPoint].x;
					}
					if(isUnderUpperBound && isAboveLowerBound) //Point within 90 degree viewing window
					{
						dyTest = this.point[prevPoint].y - this.point[iPoint].y;
						if(!isUp) dyTest += this.view.height;
						dxTest = Math.abs(this.point[prevPoint].x - this.point[iPoint].x);
						if(dyTest <= dyBest) {
							setNewBest = !(dyTest == dyBest && dxTest > dxBest);
							if(setNewBest) {
								dxBest = dxTest;
								dyBest = dyTest;
								bestPoint = iPoint;
							}
						}
					}
					iPoint = (this.point.length + iPoint - 1)%this.point.length;
				} while(iPoint != prevPoint);
				this.currentPoint = bestPoint;
				//		this.currentPoint = (this.point.length + this.currentPoint - 1)%this.point.length;
			}
			else if(controlDirection === SplitTime.Direction.E) //Right
			{
				do //While index point does not equal original point
				{
					var isRight = this.point[iPoint].x > this.point[prevPoint].x;
					if(isRight) {
						isUnderUpperBound = this.point[iPoint].y >= -this.point[iPoint].x + this.point[prevPoint].x + this.point[prevPoint].y;
						isAboveLowerBound = this.point[iPoint].y <= this.point[iPoint].x - this.point[prevPoint].x + this.point[prevPoint].y;
					} else {
						isUnderUpperBound = this.point[iPoint].y >= -this.point[iPoint].x + (this.point[prevPoint].x - this.view.width) + this.point[prevPoint].y;
						isAboveLowerBound = this.point[iPoint].y <= this.point[iPoint].x - (this.point[prevPoint].x - this.view.width) + this.point[prevPoint].y;
					}
					if(isUnderUpperBound && isAboveLowerBound) //Point within 90 degree viewing window
					{
						dxTest =  this.point[iPoint].x - this.point[prevPoint].x;
						if(!isRight) dxTest += this.view.width;
						dyTest = Math.abs(this.point[prevPoint].y - this.point[iPoint].y);
						if(dxTest <= dxBest) {
							setNewBest = !(dxTest == dxBest && dyTest > dyBest);
							if(setNewBest) {
								dxBest = dxTest;
								dyBest = dyTest;
								bestPoint = iPoint;
							}
						}
					}
					iPoint = (iPoint + 1)%this.point.length;
				} while(iPoint != prevPoint);
				this.currentPoint = bestPoint;
				//this.currentPoint = (this.currentPoint + 1)%this.point.length;
			}
			else if(controlDirection === SplitTime.Direction.S) //Down
			{
				do //While index point does not equal original point
				{
					var isDown = this.point[iPoint].y > this.point[prevPoint].y;
					if(isDown) {
						isUnderUpperBound = this.point[iPoint].x >= -this.point[iPoint].y + this.point[prevPoint].y + this.point[prevPoint].x;
						isAboveLowerBound = this.point[iPoint].x <= this.point[iPoint].y - this.point[prevPoint].y + this.point[prevPoint].x;
					} else {
						isUnderUpperBound = this.point[iPoint].x >= -this.point[iPoint].y + (this.point[prevPoint].y - this.view.height) + this.point[prevPoint].x;
						isAboveLowerBound = this.point[iPoint].x <= this.point[iPoint].y - (this.point[prevPoint].y - this.view.height) + this.point[prevPoint].x;
					}
					if(isUnderUpperBound && isAboveLowerBound) //Point within 90 degree viewing window
					{
						dyTest = this.point[iPoint].y - this.point[prevPoint].y;
						if(!isDown) dyTest += this.view.height;
						dxTest = Math.abs(this.point[prevPoint].x - this.point[iPoint].x);
						if(dyTest <= dyBest) {
							setNewBest = !(dyTest == dyBest && dxTest > dxBest);
							if(setNewBest) {
								dxBest = dxTest;
								dyBest = dyTest;
								bestPoint = iPoint;
							}
						}
					}
					iPoint = (iPoint + 1)%this.point.length;
				} while(iPoint != prevPoint);
				this.currentPoint = bestPoint;
				//		this.currentPoint = (this.currentPoint + 1)%this.point.length;
			}
		};
	}
}

// //File selection SplitTime.Menu
// SplitTime.setupFileSelect = function() {
// 	opMenu.killPoints();
// 	opMenu.cursor = SplitTime.image.get("torchCursor.png");
// 	opMenu.background = SplitTime.buffer;
//
// 	SplitTime.canvasBlackout(SplitTime.bufferCtx);
// 	SplitTime.bufferCtx.fillStyle = "#FFFFFF";
// 	SplitTime.bufferCtx.font = "20px Arial";
// 	SplitTime.bufferCtx.fillText("Select a file.", 10, 30);
// 	for(var col = 0; col < 3; col++)
// 	{
// 		for(var index = 1; index <= 7; index++)
// 		{
// 			var fileName = (index + col*7);
// 			SplitTime.bufferCtx.fillText(fileName, 40 + 200*col, 10 + 60*index);
// 			opMenu.addPoint(10 + 200*col, 60*index);
// 			try
// 			{
// 				var item = localStorage.getItem(GAMEID + "_" + fileName + "_SAVE");
// 				var tSAVE = JSON.parse(item);
// 				SplitTime.bufferCtx.fillText(tSAVE.timeDays + "." + tSAVE.timeHours + "." + tSAVE.timeMinutes + "." + tSAVE.timeSeconds, 40 + 200*col, 35 + 60*index);
// 			}
// 			catch(e)
// 			{
// 				SplitTime.bufferCtx.fillText("No Save Data", 40 + 200*col, 35 + 60*index);
// 			}
// 		}
// 	}
// };
