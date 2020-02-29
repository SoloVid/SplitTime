namespace SplitTime.conversation {
    export class InterruptibleSpecBuilder {
        constructor(
            public readonly condition: Condition,
            public readonly sectionBuilder: SectionBuilder,
            public readonly body?: Body
        ) {}

        build(): InterruptibleSpec {
            return new InterruptibleSpec(this.condition, this.sectionBuilder.build(), this.body)
        }
    }
}
