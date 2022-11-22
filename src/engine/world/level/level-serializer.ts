import { ObjectSerializer } from "../../file/object-serializer";
import { AnySerializer, AnyDeserializer } from "../../file/any-serializer";
import { World } from "../world";
import { Level } from "./level";

type level_json_t = {
    id: string;
};
export class LevelSerializer implements ObjectSerializer<Level> {
    constructor(private readonly world: World) { }
    isT(thing: unknown): thing is Level {
        return thing instanceof Level;
    }
    serialize(s: AnySerializer, thing: Level): level_json_t {
        for (const body of thing.bodies) {
            s.serialize(body);
        }
        return {
            id: thing.id
        };
    }
    deserialize(s: AnyDeserializer, data: level_json_t): Level {
        // We're trusting bodies to get themselves back into their appropriate levels
        // for(const bodyData of data.bodies) {
        //     s.deserialize(bodyData);
        // }
        return this.world.getLevel(data.id);
    }
}
