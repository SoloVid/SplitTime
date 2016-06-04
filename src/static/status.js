/*The status system is built off of the action system. It is intended to handle prolonged inflictions of statuses.
See the "hurt" status below for an example.
It is important to note that Statuses are somewhat different from both Actions and Motions by definition.
	Statuses are often dependent on the attacker instead of the person who "has" the SLVDE.Status.
	For this reason, we utilize JS prototypal inheritance in Statuses 
	in order to hold more information in the SLVDE.Status than just the SLVDE.Sprite.*/

SLVDE.Status = {};

SLVDE.baseStatus = function() { };

SLVDE.baseStatus.prototype.time = 0;
SLVDE.baseStatus.prototype.apply = function(person) { this.time--; };
SLVDE.baseStatus.prototype.see = function(person) { };

SLVDE.Status["hurt"] = function(sec) { 
	if(sec !== undefined)
	{
		this.time = sec*SLVDE.FPS;
	}
};
SLVDE.Status["hurt"].prototype = new SLVDE.baseStatus();
SLVDE.Status["hurt"].prototype.constructor = SLVDE.Status["hurt"];
SLVDE.Status["hurt"].prototype.apply = function(person) {
	if(SLVDE.frameClock == 1)
	{
		person.preventRender();
	}
};