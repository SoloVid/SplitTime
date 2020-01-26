namespace SplitTime.body {
	var templates: { [templateName: string]: () => SplitTime.Body } = {};

	export function registerTemplate(templateName: string, callback: () => SplitTime.Body) {
		// Test function
		if(!(callback() instanceof SplitTime.Body)) {
			throw new Error("Callback for Body template \"" + templateName + "\" doesn't return a Body");
		}
		templates[templateName] = callback;
	};

	export function getTemplateInstance(templateName: string): SplitTime.Body {
		if(!templates[templateName]) {
			throw new Error("Body template " + templateName + " not found");
		}
		return templates[templateName]();
	};
}