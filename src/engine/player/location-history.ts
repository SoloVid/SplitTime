import { ILevelLocation2, int, assert, mod } from "../splitTime";
import { areLocationsEquivalent, copyLocation } from "../world/level/level-location";
export class LocationHistory {
    private readonly circularBuffer: (ILevelLocation2 | undefined)[];
    private nextPosition = 0;
    private started = false;
    constructor(retentionNum: int) {
        this.circularBuffer = new Array(retentionNum);
    }
    push(location: ILevelLocation2) {
        if (this.started) {
            const last = this.get(1);
            if (areLocationsEquivalent(last, location)) {
                return;
            }
        }
        const record = this.circularBuffer[this.nextPosition];
        if (!!record) {
            record.level = location.level;
            record.x = location.x;
            record.y = location.y;
            record.z = location.z;
        }
        else {
            this.circularBuffer[this.nextPosition] = copyLocation(location);
        }
        this.nextPosition++;
        if (this.nextPosition >= this.circularBuffer.length) {
            this.nextPosition = 0;
        }
        this.started = true;
    }
    get(howManyBack: int): ILevelLocation2 {
        assert(howManyBack <= this.circularBuffer.length, `History only goes ${this.circularBuffer.length} back`);
        assert(howManyBack > 0, "howManyBack should be greater than zero");
        const pos = mod(this.nextPosition - howManyBack, this.circularBuffer.length);
        const location = this.circularBuffer[pos];
        assert(!!location, `Location history doesn't yet go back ${howManyBack} steps`);
        return location;
    }
}
