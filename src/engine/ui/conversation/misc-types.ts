import { Line } from "./spec/line";
import { MidConversationAction } from "./spec/mid-conversation-action";
    export type ConversationLeafNode = SpeechBubbleContentsSpec | MidConversationAction
import { SectionSpec } from "./spec/section-spec";
import { LineSequence } from "./spec/line-sequence";
import { DSL } from "./spec/dsl";
    export type FancySetupFunc = (f: FancyDsl) => void
export type ConversationLeafNode = Line | MidConversationAction;
export type SectionSpecPart = SectionSpec | LineSequence | MidConversationAction;
export type SetupFunc = (d: DSL) => void;
