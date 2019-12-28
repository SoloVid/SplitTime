/*The status system is built off of the action system. It is intended to handle prolonged inflictions of statuses.
See the "hurt" status below for an example.
It is important to note that Statuses are somewhat different from both Actions and Motions by definition.
	Statuses are often dependent on the attacker instead of the person who "has" the SplitTime.Status.
	For this reason, we utilize JS prototypal inheritance in Statuses 
	in order to hold more information in the SplitTime.Status than just the SplitTime.Body.*/

SplitTime.Status = {};

SplitTime.BaseStatus = function() { };

SplitTime.BaseStatus.prototype.time = 0;
SplitTime.BaseStatus.prototype.apply = function(person) { this.time--; };
SplitTime.BaseStatus.prototype.see = function(person) { };

SplitTime.Status.Hurt = function(sec) {
	if(sec !== undefined)
	{
		this.time = sec*SplitTime.FPS;
	}
};
SplitTime.Status.Hurt.prototype = new SplitTime.BaseStatus();
SplitTime.Status.Hurt.prototype.constructor = SplitTime.Status.Hurt;
SplitTime.Status.Hurt.prototype.apply = function(person) {
	if(SplitTime.frameClock == 1)
	{
		person.preventRender();
	}
};