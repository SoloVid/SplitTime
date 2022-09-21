import { body } from "../../splitTime";
import * as splitTime from "../../splitTime";
/** @deprecated maybe because this is painful to use and is less important because of collage montages */
export class TemplateManager {
    private templates: {
        [templateName: string]: () => splitTime.Body;
    } = {};
    register(templateName: string, callback: () => splitTime.Body) {
        // Test function
        if (!(callback() instanceof splitTime.Body)) {
            throw new Error('Callback for Body template "' +
                templateName +
                "\" doesn't return a Body");
        }
        this.templates[templateName] = callback;
    }
    getInstance(templateName: string): splitTime.Body {
        if (!this.templates[templateName]) {
            throw new Error("Body template " + templateName + " not found");
        }
        const body = this.templates[templateName]();
        body.template = templateName;
        return body;
    }
}
// This object is a convenience for game code and should not be used in engine code
// It is also used by the level editor
// FTODO: Try to remove this singleton and instead let the game code specify this.
export const BODY_TEMPLATES = new body.TemplateManager();
