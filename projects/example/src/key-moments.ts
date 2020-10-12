namespace G.moment {
    export namespace day1 {
        export const midnight = new splitTime.time.Moment()
        export const dawn = new splitTime.time.Moment()
        export const noon = new splitTime.time.Moment()
        export const dusk = new splitTime.time.Moment()

        defer(() => {
            midnight.setTime(G.mainTimeline.hour(24), G.mainTimeline.beginning)
            dawn.setTime(G.mainTimeline.hour(6), midnight)
            noon.setTime(G.mainTimeline.hour(12), midnight)
            dusk.setTime(G.mainTimeline.hour(20), midnight)
        })
    }
}