import { SetupFunc } from "../misc-types";
import { Options } from "../spec/dsl";
import { ConversationSpec } from "../spec/conversation-spec";
import { ConversationDslBuilder } from "./conversation-dsl-builder";
export class ConversationSpecBuilder {
    constructor(private readonly setup: SetupFunc, private readonly options?: Partial<Options>) { }
    build(): ConversationSpec {
        const builder = new ConversationDslBuilder(this.options);
        this.setup(builder);
        return builder.build();
    }
}
