import { Level, game_seconds } from "../splitTime";
interface MinimalBody {
    level: Level;
}
export function getFromBody(body: MinimalBody): game_seconds {
    return getFromLevel(body.level);
}
export function getFromLevel(level: Level): game_seconds {
    return level.getRegion().getTimeline().getTime();
}
