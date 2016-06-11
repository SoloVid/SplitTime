//SplitTime.Team is a class that will be used to separate out different Bodys in the game

SplitTime.Team = function(name) {
	this.name = name;
	this.alliances = [];
};

SplitTime.Team.prototype.isAllied = function(otherTeam) {
	//Self is ally
	if(otherTeam == this) 
	{
		return true;
	}
	else 
	{
		for(var i = 0; i < this.alliances.length; i++) 
		{
			if(this.alliances[i] == otherTeam)
			{
				return true;
			}
		}
		return false;
	}
};

SplitTime.Team.prototype.removeAlly = function(otherTeam) {
	for(var i = 0; i < this.alliances.length; i++)
	{
		if(this.alliances[i] == otherTeam) {
			this.alliances.splice(i, 1);
			i--;
		}
	}
};

SplitTime.allyTeams = function(team1, team2) {
	team1.alliances.push(team2);
	team2.alliances.push(team1);
};

SplitTime.unallyTeams = function(team1, team2) {
	team1.removeAlly(team2);
	team2.removeAlly(team1);
};

SplitTime.loopThroughAllies = function(person, callback) {
	for(var i = 0; i < SplitTime.boardAgent.length; i++)
	{
		var currentAgent = SplitTime.boardAgent[i];
		if(currentAgent.getTeam().isAllied(person.getTeam()))
		{
			callback(currentAgent);
		}
	}
};
SplitTime.loopThroughEnemies = function(person, callback) {
	for(var i = 0; i < SplitTime.boardAgent.length; i++)
	{
		var currentAgent = SplitTime.boardAgent[i];
		if(currentAgent.getTeam() != SplitTime.Teams["neutral"] && !currentAgent.getTeam().isAllied(person.getTeam()))
		{
			callback(currentAgent);
		}
	}
};
SplitTime.loopThroughTeam = function(person, callback) {
	for(var i = 0; i < SplitTime.boardAgent.length; i++)
	{
		var currentAgent = SplitTime.boardAgent[i];
		if(currentAgent.getTeam() == person.getTeam())
		{
			callback(currentAgent);
		}
	}
};

SplitTime.Teams["neutral"] = new SplitTime.Team("neutral");
SplitTime.Teams["heroParty"] = new SplitTime.Team("heroParty");
SplitTime.Teams["empire"] = new SplitTime.Team("empire");