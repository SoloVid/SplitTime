import { serialized_object_t } from "../../file/serialized-format-t";
import { ObjectSerializer } from "../../file/object-serializer";
import { TemplateManager } from "./template-manager";
import { AnySerializer, AnyDeserializer } from "../../file/any-serializer";
import { Body } from "engine/world/body/body"
import { Level } from "../level/level";

type body_json_t = {
    template: string | null;
    x: number;
    y: number;
    z: number;
    level: serialized_object_t;
};
export class BodySerializer implements ObjectSerializer<Body> {
    constructor(private readonly templateManager: TemplateManager) { }
    isT(thing: unknown): thing is Body {
        return thing instanceof Body;
    }
    serialize(s: AnySerializer, thing: Body): body_json_t {
        return {
            template: thing.template,
            x: thing.x,
            y: thing.y,
            z: thing.z,
            level: s.serialize(thing.getLevel())
        };
    }
    deserialize(s: AnyDeserializer, data: body_json_t): Body {
        const body = data.template
            ? this.templateManager.getInstance(data.template)
            : new Body();
        s.deserialize<Level>(data.level).then(level => body.put(level, data.x, data.y, data.z));
        return body;
    }
}
