namespace splitTime {
    type region_json_t = {
        id: string
    }

    export class RegionSerializer implements file.ObjectSerializer<Region> {
        constructor(private readonly world: World) {}

        isT(thing: any): thing is Region {
            return thing instanceof Region
        }

        serialize(s: file.AnySerializer, thing: Region): region_json_t {
            for (const level of thing.getLevels()) {
                s.serialize(level)
            }
            s.serialize(thing.getTimeline())
            return {
                id: thing.id
            }
        }

        deserialize(s: file.AnyDeserializer, data: region_json_t): Region {
            return this.world.getRegion(data.id)
        }
    }
}
