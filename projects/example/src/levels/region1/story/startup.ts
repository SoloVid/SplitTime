namespace G.region1 {

    export namespace moment {
        export const startOfStory = new splitTime.time.Moment()
        export const sequenceBreakCheck = new splitTime.time.Moment()
        defer(() => {
            startOfStory.setTime(G.mainTimeline.hour(18), G.mainTimeline.beginning)
            sequenceBreakCheck.setTime(G.mainTimeline.hour(2), startOfStory)
        })
    }
}

namespace G {
    const sequenceBreakCheckpointEvent = new splitTime.time.EventSpec("sequence-break-checkpoint", () => {
        const someCondition = true
        if (someCondition) {
            splitTime.log.warn("TODO: Handle initial sequence break")
        }
    })

    export function startTheStory() {
        G.mainTimeline.setTime(G.region1.moment.startOfStory.getTime())
        G.woman.body.putInPosition(G.region1.position.townEntrance)
        G.player.setActive(G.woman.agent)

        G.mainTimeline.schedule(G.region1.moment.sequenceBreakCheck, sequenceBreakCheckpointEvent.inst())
        G.mainTimeline.scheduleFromNow(5, G.region1.dialog.mutterSpec.inst())
    }
}