import { ObjectSerializer } from "../file/object-serializer";
import { AnySerializer, AnyDeserializer } from "../file/any-serializer";
import { Region } from "./region";
import { World } from "./world";

type region_json_t = {
    id: string;
};
export class RegionSerializer implements ObjectSerializer<Region> {
    constructor(private readonly world: World) { }
    isT(thing: unknown): thing is Region {
        return thing instanceof Region;
    }
    serialize(s: AnySerializer, thing: Region): region_json_t {
        for (const level of thing.getLevels()) {
            s.serialize(level);
        }
        s.serialize(thing.getTimeline());
        return {
            id: thing.id
        };
    }
    deserialize(s: AnyDeserializer, data: region_json_t): Region {
        return this.world.getRegion(data.id);
    }
}
