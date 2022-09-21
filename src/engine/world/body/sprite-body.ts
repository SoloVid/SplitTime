import { Sprite, direction_t, Position } from "../../splitTime";
import { ASSETS } from "../../G";
import * as splitTime from "../../splitTime";
export class SpriteBody {
    constructor(readonly sprite: Sprite, readonly body: splitTime.Body) { }
    static makeFromCollage(collageId: string, montageId?: string, direction?: direction_t | string): SpriteBody {
        const collage = ASSETS.collages.get(collageId);
        const montage = montageId ? collage.getMontage(montageId, direction) : collage.getDefaultMontage(direction);
        const body = new splitTime.Body();
        const sprite = new Sprite(body, collageId, montageId);
        body.width = montage.bodySpec.width;
        body.depth = montage.bodySpec.depth;
        body.height = montage.bodySpec.height;
        body.drawables.push(sprite);
        return new SpriteBody(sprite, body);
    }
    // FTODO: move again?
    putInPosition(position: Position, includeChildren = false): void {
        this.body.put(position.getLevel(), position.getX(), position.getY(), position.getZ(), includeChildren);
        this.body.dir = position.dir;
        this.sprite.requestStance(position.stance, position.dir, true, true);
    }
}
