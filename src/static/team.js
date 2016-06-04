//SLVDE.Team is a class that will be used to separate out different Sprites in the game

SLVDE.Team = function(name) {
	this.name = name;
	this.alliances = [];
};

SLVDE.Team.prototype.isAllied = function(otherTeam) {
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

SLVDE.Team.prototype.removeAlly = function(otherTeam) {
	for(var i = 0; i < this.alliances.length; i++)
	{
		if(this.alliances[i] == otherTeam) {
			this.alliances.splice(i, 1);
			i--;
		}
	}
};

SLVDE.allyTeams = function(team1, team2) {
	team1.alliances.push(team2);
	team2.alliances.push(team1);
};

SLVDE.unallyTeams = function(team1, team2) {
	team1.removeAlly(team2);
	team2.removeAlly(team1);
};

SLVDE.loopThroughAllies = function(person, callback) {
	for(var i = 0; i < SLVDE.boardAgent.length; i++)
	{
		var currentAgent = SLVDE.boardAgent[i];
		if(currentAgent.getTeam().isAllied(person.getTeam()))
		{
			callback(currentAgent);
		}
	}
};
SLVDE.loopThroughEnemies = function(person, callback) {
	for(var i = 0; i < SLVDE.boardAgent.length; i++)
	{
		var currentAgent = SLVDE.boardAgent[i];
		if(currentAgent.getTeam() != SLVDE.Teams["neutral"] && !currentAgent.getTeam().isAllied(person.getTeam()))
		{
			callback(currentAgent);
		}
	}
};
SLVDE.loopThroughTeam = function(person, callback) {
	for(var i = 0; i < SLVDE.boardAgent.length; i++)
	{
		var currentAgent = SLVDE.boardAgent[i];
		if(currentAgent.getTeam() == person.getTeam())
		{
			callback(currentAgent);
		}
	}
};

SLVDE.Teams["neutral"] = new SLVDE.Team("neutral");
SLVDE.Teams["heroParty"] = new SLVDE.Team("heroParty");
SLVDE.Teams["empire"] = new SLVDE.Team("empire");