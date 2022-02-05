import { ILevelLocation2, Level } from "../../splitTime";
import * as splitTime from "../../splitTime";
export class SpeechBox implements ILevelLocation2 {
    body: splitTime.Body;
    offsetX: number;
    offsetY: number;
    offsetZ: number;
    constructor(body: splitTime.Body, offsetZ: number = 0, offsetX: number = 0, offsetY: number = 0) {
        this.body = body;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.offsetZ = offsetZ;
    }
    get x(): number {
        return this.body.getX() + this.offsetX;
    }
    get y(): number {
        return this.body.getY() + this.offsetY;
    }
    get z(): number {
        return this.body.getZ() + this.offsetZ;
    }
    get level(): Level {
        return this.body.getLevel();
    }
}
