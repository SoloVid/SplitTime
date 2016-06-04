/*The time system is based on an event queue and a clock.
Primarily, events will be queued in sprite template files using registerWalkEvent() (in sprite.js).
*/

SLVDE.Time = {};
SLVDE.Time.daily = [];
SLVDE.Time.once = [];

SLVDE.Time.componentToAbsolute = function(day, hour, minute, second) {
	return day*60*60*24 + hour*60*60 + minute*60 + second;
};

SLVDE.Time.registerEvent = function(event, isDaily, time) {
	var eventQueue = (isDaily ? SLVDE.Time.daily : SLVDE.Time.once);

	if(!eventQueue[time])
	{
		eventQueue[time] = [];
	}

	eventQueue[time].push(event);
};

SLVDE.Time.advance = function(seconds) {
	var i;
	for(var index = 0; index < seconds; index++)
	{
		SLVDE.SAVE.timeSeconds = (SLVDE.SAVE.timeSeconds + 1)%60;
		if(SLVDE.SAVE.timeSeconds === 0)
		{
			SLVDE.SAVE.timeMinutes = (SLVDE.SAVE.timeMinutes + 1)%60;
			if(SLVDE.SAVE.timeMinutes === 0)
			{
				SLVDE.SAVE.timeHours = (SLVDE.SAVE.timeHours + 1)%24;
				if(SLVDE.SAVE.timeHours === 0) SLVDE.SAVE.timeDays++;
			}

			//One-time events
			var cTime = SLVDE.SAVE.timeDays*60*60*24 + SLVDE.SAVE.timeHours*60*60 + SLVDE.SAVE.timeMinutes*60 + SLVDE.SAVE.timeSeconds;
			if(cTime in SLVDE.Time.once)
			{
				for(i = 0; i < SLVDE.Time.once[cTime].length; i++)
				{
					SLVDE.Time.once[cTime][i]();
				}
			}

			//Daily events
			cTime = SLVDE.SAVE.timeHours*60*60 + SLVDE.SAVE.timeMinutes*60 + SLVDE.SAVE.timeSeconds;
			if(cTime in SLVDE.Time.daily)
			{
				for(i = 0; i < SLVDE.Time.daily[cTime].length; i++)
				{
					SLVDE.Time.daily[cTime][i]();
				}
			}
		}
	}
};

SLVDE.Time.renderClock = function(context) {
	context.drawImage(SLVDE.image["clock.png"], SLVDE.SCREENX - 140, 0);
	context.lineWidth = 1;
	context.strokeStyle="#DDDDDD";
	var hand = Math.PI/2 - (2*(SLVDE.SAVE.timeSeconds/60)*Math.PI);
	context.beginPath();
	context.moveTo(SLVDE.SCREENX - 70, 70);
	context.lineTo(SLVDE.SCREENX - 70 + 50*Math.cos(hand), 70 - 50*Math.sin(hand));
	context.stroke();
	context.lineWidth = 2;
	context.strokeStyle="#000000";
	hand = Math.PI/2 - (2*(SLVDE.SAVE.timeMinutes/60)*Math.PI);
	context.beginPath();
	context.moveTo(SLVDE.SCREENX - 70, 70);
	context.lineTo(SLVDE.SCREENX - 70 + 50*Math.cos(hand), 70 - 50*Math.sin(hand));
	context.stroke();
	context.strokeStyle="#EE0000";
	context.lineWidth = 3;
	hand = Math.PI/2 - (2*(SLVDE.SAVE.timeHours/12)*Math.PI);
	context.beginPath();
	context.moveTo(SLVDE.SCREENX - 70, 70);
	context.lineTo(SLVDE.SCREENX - 70 + 50*Math.cos(hand), 70 - 50*Math.sin(hand));
	context.stroke();
};
