import { Level } from "engine/world/level/level";
import { game_seconds } from "./timeline";

interface MinimalBody {
    level: Level;
}
export function getFromBody(body: MinimalBody): game_seconds {
    return getFromLevel(body.level);
}
export function getFromLevel(level: Level): game_seconds {
    return level.getRegion().getTimeline().getTime();
}
