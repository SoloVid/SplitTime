import { Level } from "engine/world/level/level";
import { game_seconds } from "./timeline";

interface MinimalBody {
    level: Level;
}
export function getTimeFromBody(body: MinimalBody): game_seconds {
    return getTimeFromLevel(body.level);
}
export function getTimeFromLevel(level: Level): game_seconds {
    return level.getRegion().getTimeline().getTime();
}
