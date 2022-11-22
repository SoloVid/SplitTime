import { DEBUG } from "compiler-defines";
import { assert } from "globals";
import { SpriteBody } from "./body/sprite-body";
import { Prop } from "./level/level-file-data";

type Processor = (spriteBody: SpriteBody, rawProp: Prop) => void;
export class PropPostProcessor {
    private readonly processorMap: {
        [id: string]: Processor;
    } = {};
    /**
     * Register a callback to be run for each prop created from a montage with specified
     * propPostProcessor immediately after the prop is created and placed into the level.
     *
     * The purpose of this functionality is to allow injection of non-standard behavior
     * to prop objects, since there is otherwise no good way to use level props as anything
     * more than simple bodies.
     *
     * Note that, by the time the callback is called, the prop body will already have
     * everything set as it would if it had no post processor, including its location in the level.
     *
     * @param processorId "propPostProcessor" as specified in collage editor
     * @param processor callback to process prop after creation
     */
    register(processorId: string, processor: Processor): void {
        assert(!(processorId in this.processorMap), "Processor \"" + processorId + "\" already registered");
        this.processorMap[processorId] = processor;
    }
    /**
     * Actually run a post processor for a newly instantiated prop.
     * This method is for engine use only and should not be called by game code.
     */
    process(processorId: string, newProp: SpriteBody, rawProp: Prop): void {
        if (DEBUG) {
            assert(processorId in this.processorMap, "Processor \"" + processorId + "\" not registered");
        }
        this.processorMap[processorId](newProp, rawProp);
    }
}
