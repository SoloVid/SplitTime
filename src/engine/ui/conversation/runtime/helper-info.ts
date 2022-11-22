import { CustomEventHandler } from "../../../world/body/custom-event-handler";
import { Body } from "engine/world/body/body"

export class HelperInfo {
    constructor(public readonly playerBodyGetter: () => Body | null, public readonly advanceEvent: CustomEventHandler<void>) { }
}
