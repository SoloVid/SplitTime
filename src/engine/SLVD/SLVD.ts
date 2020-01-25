namespace SLVD {
	// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER 
	export const MAX_SAFE_INTEGER = 9007199254740991;

	// from https://stackoverflow.com/a/2161748/4639640
	var scripts = document.getElementsByTagName('script');
	var path = scripts[scripts.length-1].src.split('?')[0];      // remove any ?query
	var SCRIPT_DIRECTORY = path.split('/').slice(0, -1).join('/');  // remove last filename part of path
	
	export function getScriptDirectory() {
		return SCRIPT_DIRECTORY;
	};
	
	//Get text from file; returns SLVD promise
	export function getTXT(fil: string) {
		var promise = new SLVD.Promise();
		
		var xmlhttp: XMLHttpRequest;
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
	export function getXML(fil: string) {
		var promise = new SLVD.Promise();
		
		var xmlhttp: XMLHttpRequest;
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
	
	/**
	* random integer between 1 and num
	*/
	export function randomInt(num: number) {
		return Math.floor((Math.random() * num) + 1);
	};
	
	/**
	* random integer between 1 and num
	*/
	export function randomRangedInt(min: number, max: number) {
		return Math.round((Math.random() * (max - min))) + min;
	};
	
	/**
	* random integer between 1 and num
	*/
	export function randomRanged(min: number, max: number) {
		return (Math.random() * (max - min)) + min;
	};
	
	export function randomSeed() {
		var limit = (new Date()).getTime() % 1000000;
		for(var i = 0; i < limit; i++)
		{
			Math.random();
		}
	};
	
	export function approachValue(oldValue: number, targetValue: number, step: number) {
		if(oldValue < targetValue) {
			return Math.min(oldValue + step, targetValue);
		} else {
			return Math.max(oldValue - step, targetValue);
		}
	};
	
	export function constrain(num: number, min: number, max: number) {
		return Math.max(min, Math.min(num, max));
	};
	
	export function mod(n: number, base: number) {
		return ((n % base) + base) % base;
	};
}
