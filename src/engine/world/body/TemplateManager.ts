namespace SplitTime.body {
	export class TemplateManager {
		private templates: { [templateName: string]: () => Body } = {};

		register(templateName: string, callback: () => Body) {
			// Test function
			if(!(callback() instanceof Body)) {
				throw new Error("Callback for Body template \"" + templateName + "\" doesn't return a Body");
			}
			this.templates[templateName] = callback;
		}

		getInstance(templateName: string): Body {
			if(!this.templates[templateName]) {
				throw new Error("Body template " + templateName + " not found");
			}
			const body = this.templates[templateName]();
			body.template = templateName;
			return body;
		}
	}
}

namespace G {
	// This object is a convenience for game code and should not be used in engine code
	// It is also used by the level editor
	export const BODY_TEMPLATES = new SplitTime.body.TemplateManager();
}