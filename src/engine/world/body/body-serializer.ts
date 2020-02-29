namespace SplitTime.body {
    type body_json_t = {
        template: string | null
        x: number
        y: number
        z: number
        level: file.serialized_object_t
    }

    export class BodySerializer implements file.ObjectSerializer<Body> {
        constructor(private readonly templateManager: TemplateManager) {}

        isT(thing: any): thing is Body {
            return thing instanceof Body
        }

        serialize(s: file.AnySerializer, thing: Body): body_json_t {
            return {
                template: thing.template,
                x: thing.x,
                y: thing.y,
                z: thing.z,
                level: s.serialize(thing.getLevel())
            }
        }

        deserialize(s: file.AnyDeserializer, data: body_json_t): Body {
            const body = data.template
                ? this.templateManager.getInstance(data.template)
                : new Body()
            s.deserialize<Level>(data.level).then(level =>
                body.put(level, data.x, data.y, data.z)
            )
            return body
        }
    }
}
