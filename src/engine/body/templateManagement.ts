namespace SplitTime.body {
	var templates = {};

	/**
	 * @param {string} templateName
	 * @param {function():SplitTime.Body} callback
	 */
	export function registerTemplate(templateName, callback) {
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
	export function getTemplateInstance(templateName) {
		if(!templates[templateName]) {
			return null;
		}
		return templates[templateName]();
	};
}