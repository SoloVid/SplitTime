var SLVD = {};

SLVD.speedCheck = function(name, comparison) {
	this.date = new Date();
	this.name = name;
	this.prior = comparison;
};
SLVD.speedCheck.prototype.getTime = function() {
	return this.date.getMilliseconds() - this.prior.getMilliseconds();
};
SLVD.speedCheck.prototype.logUnusual = function(allow) {
	if(!allow)
	{
		allow = 1;
	}
	if(this.getTime() > allow) {
		//console.log(this.name + " took " + this.getTime() + " milliseconds");
	}
};

//Get text from file; returns SLVD promise
SLVD.getTXT = function(fil) {
	var promise = new SLVD.Promise();
	
	var xmlhttp;
	if (window.XMLHttpRequest)
	{// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}
	else
	{// code for IE6, IE5
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange = function() { if(xmlhttp.readyState == 4) promise.resolve(xmlhttp.responseText); };
	xmlhttp.open("GET",fil,true);
	xmlhttp.send();
	return promise;
};

//Get XML DOM from file; returns SLVD promise
SLVD.getXML = function(fil) {
	var promise = new SLVD.Promise();

	var xmlhttp;
	if (window.XMLHttpRequest)
	{// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}
	else
	{// code for IE6, IE5
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4) {
			promise.resolve(xmlhttp.responseXML);
		}
	};
	xmlhttp.open("GET",fil,true);
	xmlhttp.send();
	return promise;
};

//random integer between 1 and num
SLVD.randomInt = function(num) {
	return Math.floor((Math.random() * num) + 1);
};

SLVD.randomSeed = function() {
	var limit = (new Date()).getTime() % 1000000;
	for(var i = 0; i < limit; i++)
	{
		Math.random();
	}
};

SLVD.strNthIndexOf = function(str, n, pattern) {
	var i = -1;

	while (n-- && i++ < str.length) {
		i = str.indexOf(pattern, i);
		if (i < 0) break;
	}

	return i;
};

SLVD.strReplaceNth = function(str, n, regex, replacement) {
	var nth = 0;
	return str.replace(regex, function(match) {
		if(nth++ == n) {
			if(replacement instanceof Function)
			{
				return replacement.apply(this, arguments.slice());
			}
			else {
				return replacement;
			}
		}
		else {
			return match;
		}
	});
};
