import { LocationHistory } from "../../engine/player/location-history"
import { Level } from "../../engine/world/level/level"
import { ILevelLocation2 } from "../../engine/world/level/level-location"
import { int } from "../../globals"
import { player } from "./test-player"

player.scenario("LocationHistory tracks location history", t => {
    const history = new LocationHistory(4)

    history.push(makeLocation(0))
    t.assertEqual(0, history.get(1).x, "Locations should match")
    history.push(makeLocation(1))
    t.assertEqual(1, history.get(1).x, "Locations should match")
    history.push(makeLocation(2))
    t.assertEqual(2, history.get(1).x, "Locations should match")
    history.push(makeLocation(3))
    t.assertEqual(3, history.get(1).x, "Locations should match")
    history.push(makeLocation(4))
    t.assertEqual(4, history.get(1).x, "Locations should match")
    t.assertEqual(3, history.get(2).x, "Locations should match")
    t.assertEqual(2, history.get(3).x, "Locations should match")
    t.assertEqual(1, history.get(4).x, "Locations should match")
    t.assertThrow(() => history.get(5), "Beyond bounds should throw exception")
})

player.scenario("LocationHistory throws exception when not filled", t => {
    const history = new LocationHistory(4)
    t.assertThrow(() => history.get(1), "Get from new LocationHistory should throw exception")
    history.push(makeLocation(0))
    t.assertEqual(0, history.get(1).x, "Locations should match")
    t.assertThrow(() => history.get(2), "Get from unfilled LocationHistory should throw exception")
})

player.scenario("LocationHistory throws exception on bad gets", t => {
    const history = new LocationHistory(4)
    history.push(makeLocation(0))
    t.assertThrow(() => history.get(0), "LocationHistory#get(0) should throw")
    t.assertThrow(() => history.get(-1), "LocationHistory#get(-1) should throw")
    t.assertThrow(() => history.get(4), "LocationHistory#get(>= length) should throw")
})

function makeLocation(num: int): ILevelLocation2 {
    return {
        level: {} as Level,
        x: num,
        y: 0,
        z: 0
    }
}
