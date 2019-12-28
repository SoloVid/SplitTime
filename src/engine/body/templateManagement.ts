dependsOn("Body.js");

var templates = {};

/**
 * @param {string} templateName
 * @param {function():SplitTime.Body} callback
 */
SplitTime.Body.registerTemplate = function(templateName, callback) {
	// Test function
	if(!(callback() instanceof SplitTime.Body)) {
		throw new Error("Callback for Body template \"" + templateName + "\" doesn't return a Body");
	}
	templates[templateName] = callback;
};

/**
 *
 * @param {string} templateName
 * @return {SplitTime.Body}
 */
SplitTime.Body.getTemplateInstance = function(templateName) {
	if(!templates[templateName]) {
		return null;
	}
	return templates[templateName]();
};
