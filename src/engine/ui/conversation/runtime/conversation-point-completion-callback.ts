import { ConversationPointRuntimeManager } from "./conversation-runtime-manager";
import { ConversationLeafNode } from "../misc-types";
import { SimpleCallback } from "engine/utils/callback";

export class ConversationPointCompletionCallback implements SimpleCallback<void> {
    constructor(private readonly runtime: ConversationPointRuntimeManager, private readonly node: ConversationLeafNode) { }
    callBack(): void {
        this.runtime.at(this.node).advance();
    }
}
