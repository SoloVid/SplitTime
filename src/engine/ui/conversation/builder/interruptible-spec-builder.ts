import { CustomEventHandler } from "../../../world/body/custom-event-handler";
import { Condition } from "../spec/dsl";
import { SectionBuilder } from "./section-builder";
import { InterruptibleSpec } from "../spec/interruptible-spec";
import { Body } from "engine/world/body/body"

export class InterruptibleSpecBuilder {
    constructor(public readonly events: CustomEventHandler<void>[], public readonly condition: Condition, public readonly sectionBuilder: SectionBuilder, public readonly body?: Body) { }
    build(): InterruptibleSpec {
        return new InterruptibleSpec(this.events, this.condition, this.sectionBuilder.build(), this.body);
    }
}
