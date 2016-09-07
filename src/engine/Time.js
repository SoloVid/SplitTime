/*The time system is based on an event queue and a clock.
Primarily, events will be queued in sprite template files using registerWalkEvent() (in sprite.js).
*/

SplitTime.Time = {};
SplitTime.Time.daily = [];
SplitTime.Time.once = [];

SplitTime.Time.componentToAbsolute = function(day, hour, minute, second) {
	return day*60*60*24 + hour*60*60 + minute*60 + second;
};

SplitTime.Time.registerEvent = function(event, isDaily, time) {
	var eventQueue = (isDaily ? SplitTime.Time.daily : SplitTime.Time.once);

	if(!eventQueue[time])
	{
		eventQueue[time] = [];
	}

	eventQueue[time].push(event);
};

SplitTime.Time.advance = function(seconds) {
	var i;
	for(var index = 0; index < seconds; index++)
	{
		SplitTime.SAVE.timeSeconds = (SplitTime.SAVE.timeSeconds + 1)%60;
		if(SplitTime.SAVE.timeSeconds === 0)
		{
			SplitTime.SAVE.timeMinutes = (SplitTime.SAVE.timeMinutes + 1)%60;
			if(SplitTime.SAVE.timeMinutes === 0)
			{
				SplitTime.SAVE.timeHours = (SplitTime.SAVE.timeHours + 1)%24;
				if(SplitTime.SAVE.timeHours === 0) SplitTime.SAVE.timeDays++;
			}

			//One-time events
			var cTime = SplitTime.SAVE.timeDays*60*60*24 + SplitTime.SAVE.timeHours*60*60 + SplitTime.SAVE.timeMinutes*60 + SplitTime.SAVE.timeSeconds;
			if(cTime in SplitTime.Time.once)
			{
				for(i = 0; i < SplitTime.Time.once[cTime].length; i++)
				{
					SplitTime.Time.once[cTime][i]();
				}
			}

			//Daily events
			cTime = SplitTime.SAVE.timeHours*60*60 + SplitTime.SAVE.timeMinutes*60 + SplitTime.SAVE.timeSeconds;
			if(cTime in SplitTime.Time.daily)
			{
				for(i = 0; i < SplitTime.Time.daily[cTime].length; i++)
				{
					SplitTime.Time.daily[cTime][i]();
				}
			}
		}
	}
};

SplitTime.Time.renderClock = function(context) {
	context.drawImage(SplitTime.Image.get("clock.png"), SplitTime.SCREENX - 140, 0);
	context.lineWidth = 1;
	context.strokeStyle="#DDDDDD";
	var hand = Math.PI/2 - (2*(SplitTime.SAVE.timeSeconds/60)*Math.PI);
	context.beginPath();
	context.moveTo(SplitTime.SCREENX - 70, 70);
	context.lineTo(SplitTime.SCREENX - 70 + 50*Math.cos(hand), 70 - 50*Math.sin(hand));
	context.stroke();
	context.lineWidth = 2;
	context.strokeStyle="#000000";
	hand = Math.PI/2 - (2*(SplitTime.SAVE.timeMinutes/60)*Math.PI);
	context.beginPath();
	context.moveTo(SplitTime.SCREENX - 70, 70);
	context.lineTo(SplitTime.SCREENX - 70 + 50*Math.cos(hand), 70 - 50*Math.sin(hand));
	context.stroke();
	context.strokeStyle="#EE0000";
	context.lineWidth = 3;
	hand = Math.PI/2 - (2*(SplitTime.SAVE.timeHours/12)*Math.PI);
	context.beginPath();
	context.moveTo(SplitTime.SCREENX - 70, 70);
	context.lineTo(SplitTime.SCREENX - 70 + 50*Math.cos(hand), 70 - 50*Math.sin(hand));
	context.stroke();
};
