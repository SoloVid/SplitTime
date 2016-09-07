dependsOn("Body.js");

SplitTime.Body.prototype.status = [];
SplitTime.Body.prototype.handleStatus = function() {
	if(this.status.length > 0)
	{
		for(var i = 0; i < this.status.length; i++)
		{
			var currentStatus = this.status[i];
			currentStatus.apply(this);
			currentStatus.time--;
			if(currentStatus.time <= 0)
			{
				this.status.splice(i, 1);
			}
		}
	}
};
SplitTime.Body.prototype.seeStatus = function() {
	for(var i = 0; i < this.status.length; i++)
	{
		this.status[i].see(this);
	}
};

//All of the "give" functions are intended to be passed a "new" object
SplitTime.Body.prototype.giveStatus = function(status) {
	if(this.status.length === 0)
	{
		this.status = [];
	}

	if((typeof status) == "string")
	{
		status = new SplitTime.Status[status]();
	}

	this.status.push(status);
};

SplitTime.Body.prototype.hasStatus = function(status) {
	if((typeof status) == "string")
	{
		status = SplitTime.Status[status];
	}

	for(var i = 0; i < this.status.length; i++)
	{
		if(this.status[i] instanceof status)
		{
			return true;
		}
	}
	return false;
};
