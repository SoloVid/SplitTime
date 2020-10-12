defer(() => {
    var INTERACT_FUDGE = 16

    G.button.PRIMARY_INTERACT.onUp(function() {
        // This file is only concerned with ACTION state; so don't do anything if the state is something else.
        if (!G.main.isRunning()) {
            return
        }

        if (G.player.getActive() !== null) {
            splitTime.player.tryPlayerInteract(G.player.getActiveBody())
        }
    })
})
