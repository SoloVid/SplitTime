import { CustomEventHandler } from "../../../world/body/custom-event-handler";
import * as splitTime from "../../../splitTime";
export class HelperInfo {
    constructor(public readonly playerBodyGetter: () => splitTime.Body | null, public readonly advanceEvent: CustomEventHandler<void>) { }
}
