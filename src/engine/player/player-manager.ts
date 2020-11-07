namespace splitTime.player {

    export class PlayerManager {
        activePlayerAgent: PlayerAgent | null = null
        available: PlayerAgent[] = []

        constructor(
            public readonly perspective: Perspective,
            private readonly joyStick: controls.JoyStick
        ) {}

        makeAgent(spriteBody: SpriteBody, stamina?: MeteredStat): PlayerAgent {
            return new PlayerAgent(this, this.joyStick, spriteBody, stamina)
        }

        add(playerAgent: PlayerAgent) {
            this.available.push(playerAgent)
        }

        swap(playerAgentOut: PlayerAgent, playerAgentIn: PlayerAgent) {
            for (let i = 0; i < this.available.length; i++) {
                if (this.available[i] === playerAgentOut) {
                    this.available.splice(i, 1, playerAgentIn)
                }
            }
            if (this.getActive() === playerAgentOut) {
                this.setActive(playerAgentIn)
            }
        }

        getActive(): PlayerAgent | null {
            return this.activePlayerAgent
        }

        getActiveBody(): splitTime.Body {
            assert(this.activePlayerAgent !== null, "activePlayerAgent is null")
            return this.activePlayerAgent.body
        }

        setActive(playerAgent: PlayerAgent): void {
            Promise.resolve().then(() => {
                this.activePlayerAgent = playerAgent
                this.perspective.playerBody = playerAgent.body
                this.perspective.camera.setFocusPoint(
                    new splitTime.InFrontOfBody(playerAgent.body,
                        Math.min(this.perspective.view.width, this.perspective.view.height) / 4))
            })
        }

        getLadderEvent(direction: splitTime.direction_t): (body: Body, eventId: string) => void {
            return (body: splitTime.Body, eventId: string) => {
                if (body === this.getActiveBody()) {
                    this.getActive()!.setLadder(eventId, direction)
                }
            }
        }
    }
}
