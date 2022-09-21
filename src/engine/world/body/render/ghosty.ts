import { Sprite, SpriteBody, ILevelLocation2, Pledge, STOP_CALLBACKS } from "../../../splitTime";
import { Drawable } from "./drawable";
import * as splitTime from "../../../splitTime";
/** @deprecated need to develop some patterns that don't involve this */
export function extractSprite(body: splitTime.Body): Sprite {
    const sprite = tryExtractSprite(body);
    if (sprite === null) {
        throw new Error("No Sprite associated with Body");
    }
    return sprite;
}
/** @deprecated need to develop some patterns that don't involve this */
export function tryExtractSprite(body: splitTime.Body): Sprite | null {
    for (const drawable of body.drawables) {
        if (drawable instanceof Sprite) {
            return drawable;
        }
    }
    return null;
}
export function createGhost(sourceSpriteBody: SpriteBody, location: ILevelLocation2): SpriteBody {
    const tempSprite = sourceSpriteBody.sprite.clone();
    const tempBody = new splitTime.Body();
    tempBody.width = 0;
    tempBody.depth = 0;
    tempBody.putInLocation(location);
    tempBody.drawables.push(tempSprite);
    return new SpriteBody(tempSprite, tempBody);
}
export function fadeInBody(body: splitTime.Body, startOpacity: number = 0, maxOpacity: number = 1, speed: number = 2): PromiseLike<void> {
    const promises = [];
    for (const d of body.drawables) {
        promises.push(fadeInBodyDrawable(body, d, startOpacity, maxOpacity, speed));
    }
    return Pledge.when(promises) as PromiseLike<void>;
}
function fadeInBodyDrawable(body: splitTime.Body, d: Drawable, startOpacity: number = 0, maxOpacity: number = 1, speed: number = 2): Pledge {
    d.opacityModifier = startOpacity;
    const pledge = new Pledge();
    body.registerTimeAdvanceListener(delta => {
        var dOpacity = speed * delta;
        d.opacityModifier += dOpacity;
        if (d.opacityModifier >= maxOpacity) {
            d.opacityModifier = maxOpacity;
            pledge.resolve();
            return STOP_CALLBACKS;
        }
        return;
    });
    return pledge;
}
export function fadeOutBody(body: splitTime.Body, startOpacity = 1, speed: number = 2): PromiseLike<void> {
    const promises = [];
    for (const d of body.drawables) {
        promises.push(fadeOutBodyDrawable(body, d, startOpacity, speed));
    }
    return Pledge.when(promises) as PromiseLike<void>;
}
function fadeOutBodyDrawable(body: splitTime.Body, d: Drawable, startOpacity = 1, speed: number = 2): Pledge {
    d.opacityModifier = startOpacity;
    const pledge = new Pledge();
    body.registerTimeAdvanceListener(delta => {
        var dOpacity = speed * delta;
        d.opacityModifier -= dOpacity;
        if (d.opacityModifier <= 0) {
            d.opacityModifier = 0;
            pledge.resolve();
            return STOP_CALLBACKS;
        }
        return;
    });
    return pledge;
}
export function smoothPut(body: splitTime.Body, location: ILevelLocation2): PromiseLike<void> {
    const spriteBody = new SpriteBody(extractSprite(body), body);
    const ghost = createGhost(spriteBody, body);
    // If either finishes, we don't want the other to continue
    function clearBoth() {
        ghost.body.clearLevel();
        body.fadeEnteringLevelPromise = null;
    }
    fadeOutBody(ghost.body).then(clearBoth);
    body.putInLocation(location);
    if (body.level.isLoaded()) {
        body.mover.transportLevelIfApplicable();
    }
    body.fadeEnteringLevelPromise = new Pledge();
    return body.fadeEnteringLevelPromise.then(clearBoth);
}
