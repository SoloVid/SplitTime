import { Speaker } from "../speaker";
import { MidEventCallback } from "../../../time/mid-event-action";
import { CustomEventHandler } from "../../../world/body/custom-event-handler";
export type Condition = true | (() => boolean);
export interface DSL {
    /** Explicitly register a speaker as part of this conversation (section). */
    listen(speaker: Speaker): void;
    /** Message window without speaker. e.g. narrator or text read */
    message(line: string, options?: Partial<Options>): void;
    /** Speaker's line of dialogue. */
    say(speaker: Speaker, line: string, options?: Partial<Options>): void;
    /** Allow localized interruptions/cancellations. */
    section(sectionSetup: () => void, options?: Partial<Options>): SectionChain;
    /** Action in the middle of a conversation. */
    do(action: MidEventCallback): void;
}
export interface SectionChain {
    /**
     * The modified section can be canceled when a speaker leaves.
     * Only one cancelable can be specified per section.
     */
    cancelable(sectionSetup?: () => void): SectionChain;
    /**
     * The modified section can be interrupted when one of the events
     * is triggered on a body associated with a speaker in the section
     */
    interruptible(condition?: Condition, sectionSetup?: () => void, ...events: CustomEventHandler<void>[]): SectionChain;
}
export interface Options {
    /** Multiplier on importance */
    importance: number;
}
