dependsOn("Body.js");

SplitTime.Body.prototype.act = [];
SplitTime.Body.prototype.pushAct = function(item) {
	if(this.act.length === 0) {
		this.act = [];
	}
	this.act.push(item);
};
SplitTime.Body.prototype.spliceAct = function(index, length) {
	this.act.splice(index, length);
	if(this.act.length <= 0)
	{
		delete this.act;
	}
};
SplitTime.Body.prototype.actSet = [];
SplitTime.Body.prototype.rcvr = 0;
SplitTime.Body.prototype.getAct = function(index) {
	return this.act[index];
};
SplitTime.Body.prototype.getActTime = function(index) {
	return this.act[index][1];
};
SplitTime.Body.prototype.getActOpt = function(index) {
	return this.actSet[index];
};
SplitTime.Body.prototype.getActOptProb = function(index) {
	return this.actSet[index].prob;
};
SplitTime.Body.prototype.handleAction = function() {
	if(this.canAct)
	{
		//Start new action
		var newAct = this.pickAction();
		if(newAct !== null)
		{
			this.pushAct(newAct);
			newAct.use(this);
		}

		//Handle persistent actions
		for(var i = 0; i < this.act.length; i++)
		{
			var currentAct = this.getAct(i);
			currentAct.update(this);
			if(currentAct.time <= 0)
			{
				this.spliceAct(i, 1);
				if(SplitTime.process == "TRPG")
				{
					SplitTime.TRPGNextTurn(); //in TRPG.js
				}
			}
		}
	}
};
SplitTime.Body.prototype.pickAction = function() {
	var actSet = [];
	var rand, i;
	var totProb = 0;
	//Create a list of useable actions
	for(i = 0; i < this.actSet.length; i++)
	{
		var actOpt = this.getActOpt(i);
		if(actOpt.canUse(this))
		{
			var typeTaken = false;
			for(var j = 0; j < this.act.length; j++)
			{
				if(actOpt.type == this.getAct(j).type)
				{
					typeTaken = true;
					j = this.act.length;
				}
			}
			if(!typeTaken)
			{
				actSet.push(actOpt);
				totProb += actOpt.getProbability();
			}
		}
	}

	//In case of one (will normally work unless "zero probability" of default actions)
	if(actSet.length > 0 && totProb <= 0)
	{
		return actSet[0];
	}

	//Pick random action based on probabilities
	rand = SLVD.randomInt(totProb);
	var partProb = 0;
	for(i = 0; i < actSet.length; i++)
	{
		partProb += actSet[i].getProbability();
		if(rand <= partProb)
		{
			return actSet[i];
		}
	}
	return null;
};
SplitTime.Body.prototype.requestAction = function(action) {
	if(this.canAct)
	{
		var typeTaken = false;
		for(var j = 0; j < this.act.length; j++)
		{
			if(action.type == this.getAct(j).type)
			{
				typeTaken = true;
				j = this.act.length;
			}
		}
		if(!typeTaken)
		{
			this.pushAct(action);
			action.use(this);
		}
	}
};
SplitTime.Body.prototype.seeAction = function() {
	for(var i = 0; i < this.act.length; i++)
	{
		this.act[i].see(this);
	}
};

//All of the "give" functions are intended to be passed a "new" object
SplitTime.Body.prototype.giveAction = function(action, keyFuncHandle) {
	if(this.actSet.length === 0)
	{
		this.actSet = [];
	}

	if((typeof action) == "string")
	{
		action = new SplitTime.Action[action]();
	}

	this.actSet.push(action);

	if(keyFuncHandle !== undefined)
	{
		var tempKeyFunc = {};

		for(var i in this.keyFunc)
		{
			tempKeyFunc[i] = this.keyFunc[i];
		}

		tempKeyFunc[keyFuncHandle] = (function(person, act) {
			// console.log("assigned " + person + " with " + act + " on " + keyFuncHandle);
			return function() {
				// console.log("using action");
				person.pushAct(act);
				act.use(person);
			};
		} (this, action));

		this.keyFunc = tempKeyFunc;
	}
};
