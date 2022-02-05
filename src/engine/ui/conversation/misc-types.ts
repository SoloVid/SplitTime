import { Line } from "./spec/line";
import { MidConversationAction } from "./spec/mid-conversation-action";
import { SectionSpec } from "./spec/section-spec";
import { LineSequence } from "./spec/line-sequence";
import { DSL } from "./spec/dsl";
export type ConversationLeafNode = Line | MidConversationAction;
export type SectionSpecPart = SectionSpec | LineSequence | MidConversationAction;
export type SetupFunc = (d: DSL) => void;
