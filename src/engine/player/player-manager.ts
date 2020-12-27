namespace splitTime.player {

    export class PlayerManager {
        party: PlayerParty
        private _controlsLocked: boolean = false

        constructor(
            public readonly perspective: Perspective,
            private readonly joyStick: controls.JoyStick
        ) {
            this.party = new PlayerParty(this)
        }

        makeAgent(spriteBody: SpriteBody, stamina?: MeteredStat): PlayerAgent {
            return new PlayerAgent(this, this.joyStick, spriteBody, stamina)
        }

        getActive(): PlayerAgent | null {
            return this.party.getActive()
        }

        getActiveBody(): splitTime.Body {
            const activeAgent = this.getActive()
            assert(activeAgent !== null, "activePlayerAgent is null")
            return activeAgent.body
        }

        getLadderEvent(direction: splitTime.direction_t): (body: Body, eventId: string) => void {
            return (body: splitTime.Body, eventId: string) => {
                if (body === this.getActiveBody()) {
                    this.getActive()!.setLadder(eventId, direction)
                }
            }
        }

        updatePlayerPerspective(): void {
            if (this.getActive() === null) {
                return
            }
            this.perspective.playerBody = this.getActiveBody()
            this.perspective.camera.setFocusPoint(
                new splitTime.InFrontOfBody(this.perspective.playerBody,
                    Math.min(this.perspective.view.width, this.perspective.view.height) / 4))
        }

        get controlsLocked(): boolean {
            return this._controlsLocked
        }
        set controlsLocked(locked: boolean) {
            this._controlsLocked = locked
        }
    }
}
