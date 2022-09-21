import { DSL, Options } from "../spec/dsl";
import { SectionBuilder } from "./section-builder";
import { Speaker } from "../speaker";
import { Line } from "../spec/line";
import { SectionBuilderFluentReturn } from "./section-builder-fluent-return";
import { MidEventCallback } from "../../../time/mid-event-action";
import { MidConversationAction } from "../spec/mid-conversation-action";
import { ConversationSpec } from "../spec/conversation-spec";
export class ConversationDslBuilder implements DSL {
    private sectionBuilder: SectionBuilder;
    constructor(private readonly options?: Partial<Options>) {
        this.sectionBuilder = new SectionBuilder(options);
    }
    listen(speaker: Speaker): void {
        this.sectionBuilder.addSpeaker(speaker);
    }
        message(lineOrSetup: string | FancySetupFunc, options?: Partial<Options>): void {
            const lineObj = new SpeechBubbleContentsSpec(null, buildFancyViaDsl(lineOrSetup), options)
        this.sectionBuilder.append(lineObj);
    }
        say(speaker: Speaker, lineOrSetup: string | FancySetupFunc, options?: Partial<Options>): void {
        this.sectionBuilder.addSpeaker(speaker);
            const lineObj = new SpeechBubbleContentsSpec(speaker, buildFancyViaDsl(lineOrSetup), options)
        this.sectionBuilder.append(lineObj);
    }
    section(setup: () => void, options?: Partial<Options>): SectionBuilderFluentReturn {
        const newSectionBuilder = new SectionBuilder();
        this.withSectionBuilder(newSectionBuilder, setup);
        this.sectionBuilder.append(newSectionBuilder);
        return new SectionBuilderFluentReturn(newSectionBuilder, this);
    }
    do(action: MidEventCallback): void {
        this.sectionBuilder.append(new MidConversationAction(action));
    }
    // waitUntil(condition: Condition): void {
    //     this.sectionBuilder.append(new Wait(condition))
    // }
    withSectionBuilder(sectionBuilder: SectionBuilder, callback: () => void): void {
        const prevSection = this.sectionBuilder;
        try {
            this.sectionBuilder = sectionBuilder;
            callback();
        }
        finally {
            this.sectionBuilder = prevSection;
        }
    }
    build(): ConversationSpec {
        return new ConversationSpec("TODO: ID", this.sectionBuilder.build());
    }
}
