// namespace SplitTime.conversation {
//     const MAIN_PARTS_NODE_ID = 1
//     const INTERRUPTIBLES_NODE_ID = 10
//     const DETECTION_INTERUPTIBLES_NODE_ID = 11
//     const CANCEL_NODE_ID = 100

//     export class ConversationTree {
//         getNextConversationPointer(section: SectionSpec, currentPointer?: conversation_tree_pointer_t): conversation_tree_pointer_t | null {
//             if(!currentPointer) {
//                 const primaryPointer = [MAIN_PARTS_NODE_ID, 0]
//                 const part = section.parts[0]
//                 if(part instanceof SectionSpec) {
//                     return primaryPointer.concat(this.getNextConversationPointer(part) || [])
//                 }
//                 return primaryPointer
//             }
//             assert(currentPointer.length > 0, "Invalid pointer (zero length)")
//             const currentPoint = this.getConversationPoint(section, currentPointer)
//             let nextPointer = null
//             const testPointer = currentPointer.slice(0)
//             while(nextPointer === null) {
//                 testPointer[testPointer.length - 1]++
//                 try {
//                     this.getConversationPoint(section, testPointer)
//                 }
//             }
//             return nextPointer
//         }

//         getConversationPoint(section: SectionSpec, pointer: conversation_tree_pointer_t): Line | MidConversationAction {
//             assert(pointer.length > 0, "Conversation pointer doesn't have a category for section")
//             const category = pointer[0]
//             switch(category) {
//                 case MAIN_PARTS_NODE_ID:
//                     assert(pointer.length >= 2, "Conversation pointer section main doesn't have an index")
//                     return this.getConversationPointFromChild(
//                         section.parts[pointer[1]],
//                         pointer.slice(2)
//                     )
//                 case INTERRUPTIBLES_NODE_ID:
//                     assert(pointer.length >= 2, "Conversation pointer section interrupted doesn't have an index")
//                     assert(section.interruptibles.length > pointer[1], "Conversation pointer references iterruptible beyond list")
//                     const interruptible = section.interruptibles[pointer[1]]
//                     assert(interruptible.section !== null, "Conversation pointer points to section of section-less interruptible")
//                     return this.getConversationPointFromChild(
//                         interruptible.section!,
//                         pointer.slice(2)
//                     )
//                 case DETECTION_INTERUPTIBLES_NODE_ID:
//                     assert(pointer.length >= 2, "Conversation pointer section detection-interrupted doesn't have an index")
//                     assert(section.detectionInterruptibles.length > pointer[1], "Conversation pointer references detection iterruptible beyond list")
//                     const dInterruptible = section.detectionInterruptibles[pointer[1]]
//                     assert(dInterruptible.section !== null, "Conversation pointer points to section of section-less detection interruptible")
//                     return this.getConversationPointFromChild(
//                         dInterruptible.section!,
//                         pointer.slice(2)
//                     )
//                 case CANCEL_NODE_ID:
//                     assert(section.cancelSection !== null, "Conversation pointer points to non-existent cancel section")
//                     return this.getConversationPointFromChild(
//                         section.cancelSection!,
//                         pointer.slice(1)
//                     )
//                 default:
//                     throw new Error("Unknown conversation section pointer category: " + category)
//             }
//         }

//         private getConversationPointFromChild(part: SectionSpecPart, pointer: conversation_tree_pointer_t): Line | MidConversationAction {
//             if(part instanceof MidConversationAction) {
//                 assert(pointer.length === 0, "Pointer to MidConversationAction is ill-formed")
//                 return part
//             }
//             if(part instanceof SectionSpec) {
//                 return this.getConversationPoint(part, pointer)
//             }
//             if(part instanceof LineSequence) {
//                 assert(pointer.length === 1, "Pointer to LineSequence is ill-formed")
//                 return part.lines[pointer[0]]
//             }
//             throw new Error("Section part type is somehow unaccounted for")
//         }

//         getConversationPart(section: SectionSpec, pointer: conversation_tree_pointer_t): SectionSpecPart {
//             assert(pointer.length > 0, "Conversation pointer doesn't have a category for section")
//             const category = pointer[0]
//             switch(category) {
//                 case MAIN_PARTS_NODE_ID:
//                     assert(pointer.length >= 2, "Conversation pointer section main doesn't have an index")
//                     return this.getConversationPointFromChild(
//                         section.parts[pointer[1]],
//                         pointer.slice(2)
//                     )
//                 case INTERRUPTIBLES_NODE_ID:
//                     assert(pointer.length >= 2, "Conversation pointer section interrupted doesn't have an index")
//                     assert(section.interruptibles.length > pointer[1], "Conversation pointer references iterruptible beyond list")
//                     const interruptible = section.interruptibles[pointer[1]]
//                     assert(interruptible.section !== null, "Conversation pointer points to section of section-less interruptible")
//                     return this.getConversationPointFromChild(
//                         interruptible.section!,
//                         pointer.slice(2)
//                     )
//                 case DETECTION_INTERUPTIBLES_NODE_ID:
//                     assert(pointer.length >= 2, "Conversation pointer section detection-interrupted doesn't have an index")
//                     assert(section.detectionInterruptibles.length > pointer[1], "Conversation pointer references detection iterruptible beyond list")
//                     const dInterruptible = section.detectionInterruptibles[pointer[1]]
//                     assert(dInterruptible.section !== null, "Conversation pointer points to section of section-less detection interruptible")
//                     return this.getConversationPointFromChild(
//                         dInterruptible.section!,
//                         pointer.slice(2)
//                     )
//                 case CANCEL_NODE_ID:
//                     assert(section.cancelSection !== null, "Conversation pointer points to non-existent cancel section")
//                     return this.getConversationPointFromChild(
//                         section.cancelSection!,
//                         pointer.slice(1)
//                     )
//                 default:
//                     throw new Error("Unknown conversation section pointer category: " + category)
//             }
//         }
//     }
// }
