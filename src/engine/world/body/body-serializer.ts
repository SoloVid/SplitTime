import { serialized_object_t } from "../../file/serialized-format-t";
import { ObjectSerializer } from "../../file/object-serializer";
import { TemplateManager } from "./template-manager";
import { AnySerializer, AnyDeserializer } from "../../file/any-serializer";
import { Level } from "../../splitTime";
import * as splitTime from "../../splitTime";
type body_json_t = {
    template: string | null;
    x: number;
    y: number;
    z: number;
    level: serialized_object_t;
};
export class BodySerializer implements ObjectSerializer<splitTime.Body> {
    constructor(private readonly templateManager: TemplateManager) { }
    isT(thing: unknown): thing is splitTime.Body {
        return thing instanceof splitTime.Body;
    }
    serialize(s: AnySerializer, thing: splitTime.Body): body_json_t {
        return {
            template: thing.template,
            x: thing.x,
            y: thing.y,
            z: thing.z,
            level: s.serialize(thing.getLevel())
        };
    }
    deserialize(s: AnyDeserializer, data: body_json_t): splitTime.Body {
        const body = data.template
            ? this.templateManager.getInstance(data.template)
            : new splitTime.Body();
        s.deserialize<Level>(data.level).then(level => body.put(level, data.x, data.y, data.z));
        return body;
    }
}
