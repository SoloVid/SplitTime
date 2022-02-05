import { Line } from "../spec/line";
import { MidConversationAction } from "../spec/mid-conversation-action";
import { Speaker } from "../speaker";
import { InterruptibleSpecBuilder } from "./interruptible-spec-builder";
import { Options } from "../spec/dsl";
import { SectionSpec } from "../spec/section-spec";
import { groupLineSequences } from "./group-line-sequences";
type BuilderPart = SectionBuilder | Line | MidConversationAction;
export class SectionBuilder {
    private readonly parts: BuilderPart[] = [];
    private readonly speakers: Speaker[] = [];
    private cancelSection: SectionBuilder | null = null;
    private interruptibles: InterruptibleSpecBuilder[] = [];
    constructor(private readonly options?: Partial<Options>) { }
    append(part: BuilderPart): void {
        this.parts.push(part);
    }
    addSpeaker(speaker: Speaker): void {
        if (this.speakers.indexOf(speaker) < 0) {
            this.speakers.push(speaker);
        }
    }
    setCancelSection(section: SectionBuilder): void {
        if (this.cancelSection !== null) {
            throw new Error("Cancel section already set");
        }
        this.cancelSection = section;
    }
    addInterruptible(interruptible: InterruptibleSpecBuilder): void {
        this.interruptibles.push(interruptible);
    }
    build(): SectionSpec {
        const builtStuff = this.parts.map(p => p instanceof SectionBuilder ? p.build() : p);
        return new SectionSpec(this.speakers, groupLineSequences(builtStuff), this.interruptibles.map(i => i.build()), this.cancelSection?.build(), this.options);
    }
}
