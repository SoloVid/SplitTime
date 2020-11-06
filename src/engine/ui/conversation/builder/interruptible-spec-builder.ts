namespace splitTime.conversation {
    export class InterruptibleSpecBuilder {
        constructor(
            public readonly events: body.CustomEventHandler<void>[],
            public readonly condition: Condition,
            public readonly sectionBuilder: SectionBuilder,
            public readonly body?: Body
        ) {}

        build(): InterruptibleSpec {
            return new InterruptibleSpec(
                this.events,
                this.condition,
                this.sectionBuilder.build(),
                this.body
            )
        }
    }
}
