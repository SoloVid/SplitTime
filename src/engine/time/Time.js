/*The time system is based on an event queue and a clock.
Primarily, events will be queued in sprite template files using registerWalkEvent() (in sprite.js).
*/

SplitTime.Time = function() {
	this.timeInMilliseconds = 0;

	this.daily = [];
	this.once = [];

    this.clockSeconds = 0; //Second hand displayed on clock out of 2560
    this.clockMinutes = 0;
    this.clockHours = 0;
    this.clockDays = 0;
};

SplitTime.Time.componentToAbsolute = function(day, hour, minute, second) {
    return day * 60 * 60 * 24 + hour * 60 * 60 + minute * 60 + second;
};

SplitTime.Time.prototype.registerEvent = function(event, isDaily, time) {
    var eventQueue = (isDaily ? this.daily : this.once);

    if(!eventQueue[time]) {
        eventQueue[time] = [];
    }

    eventQueue[time].push(event);
};

SplitTime.Time.prototype.getTimeMs = function() {
    return this.timeInMilliseconds;
};

SplitTime.Time.prototype.advance = function(milliseconds) {
    var secondsLast = Math.floor(this.timeInMilliseconds / 1000);
    this.timeInMilliseconds += milliseconds;
    var secondsNext = Math.floor(this.timeInMilliseconds / 1000);
    this.advanceSeconds(secondsNext - secondsLast);
};

SplitTime.Time.prototype.advanceSeconds = function(seconds) {
    var i;
    for(var iSecond = 0; iSecond < seconds; iSecond++) {
        this.clockSeconds = (this.clockSeconds + 1) % 60;
        if(this.clockSeconds === 0) {
            this.clockMinutes = (this.clockMinutes + 1) % 60;
            if(this.clockMinutes === 0) {
                this.clockHours = (this.clockHours + 1) % 24;
                if(this.clockHours === 0) this.clockDays++;
            }

            //One-time events
            var cTime = this.clockDays * 60 * 60 * 24 + this.clockHours * 60 * 60 + this.clockMinutes * 60 + this.clockSeconds;
            if(cTime in this.once) {
                for(i = 0; i < this.once[cTime].length; i++) {
                    this.once[cTime][i]();
                }
            }

            //Daily events
            cTime = this.clockHours * 60 * 60 + this.clockMinutes * 60 + this.clockSeconds;
            if(cTime in this.daily) {
                for(i = 0; i < this.daily[cTime].length; i++) {
                    this.daily[cTime][i]();
                }
            }
        }
    }
};

SplitTime.Time.prototype.renderClock = function(context) {
    context.drawImage(SplitTime.Image.get("clock.png"), SplitTime.SCREENX - 140, 0);
    context.lineWidth = 1;
    context.strokeStyle = "#DDDDDD";
    var hand = Math.PI / 2 - (2 * (this.clockSeconds / 60) * Math.PI);
    context.beginPath();
    context.moveTo(SplitTime.SCREENX - 70, 70);
    context.lineTo(SplitTime.SCREENX - 70 + 50 * Math.cos(hand), 70 - 50 * Math.sin(hand));
    context.stroke();
    context.lineWidth = 2;
    context.strokeStyle = "#000000";
    hand = Math.PI / 2 - (2 * (this.clockMinutes / 60) * Math.PI);
    context.beginPath();
    context.moveTo(SplitTime.SCREENX - 70, 70);
    context.lineTo(SplitTime.SCREENX - 70 + 50 * Math.cos(hand), 70 - 50 * Math.sin(hand));
    context.stroke();
    context.strokeStyle = "#EE0000";
    context.lineWidth = 3;
    hand = Math.PI / 2 - (2 * (this.clockHours / 12) * Math.PI);
    context.beginPath();
    context.moveTo(SplitTime.SCREENX - 70, 70);
    context.lineTo(SplitTime.SCREENX - 70 + 50 * Math.cos(hand), 70 - 50 * Math.sin(hand));
    context.stroke();
};
