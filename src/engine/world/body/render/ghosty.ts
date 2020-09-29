namespace splitTime.body {
    export function createGhost(
        sourceBody: Body,
        location: ILevelLocation2
    ): Body {
        if (sourceBody.drawable instanceof Sprite) {
            var tempSprite = sourceBody.drawable.clone()
            var tempBody = new Body()
            tempBody.baseLength = 0
            tempBody.putInLocation(location)
            tempBody.drawable = tempSprite
            return tempBody
        } else {
            throw new Error("Body doesn't have a Sprite object as drawable; so can't draw ghost")
        }
    }

    export function fadeInBody(
        body: Body,
        startOpacity: number = 0,
        maxOpacity: number = 1,
        speed: number = 2
    ): PromiseLike<void> {
        const sprite = body.drawable
        if (!(sprite instanceof Sprite)) {
            if (splitTime.debug.ENABLED) {
                splitTime.log.warn(
                    "Body doesn't have a Sprite object as drawable; so can't fade in"
                )
            }
            return Pledge.as();
        }

        sprite.opacity = startOpacity

        const pledge = new Pledge()
        body.registerTimeAdvanceListener(delta => {
            var dOpacity = speed * delta
            sprite.opacity += dOpacity
            if (sprite.opacity >= maxOpacity) {
                sprite.opacity = maxOpacity
                pledge.resolve()
                return STOP_CALLBACKS
            }
            return
        })
        return pledge
    }

    export function fadeOutBody(
        body: Body,
        startOpacity = 1,
        speed: number = 2
    ): PromiseLike<void> {
        const sprite = body.drawable
        if (!(sprite instanceof Sprite)) {
            if (splitTime.debug.ENABLED) {
                splitTime.log.warn(
                    "Body doesn't have a Sprite object as drawable; so can't fade in"
                )
            }
            return Pledge.as();
        }

        sprite.opacity = startOpacity

        const pledge = new Pledge()
        body.registerTimeAdvanceListener(delta => {
            var dOpacity = speed * delta
            sprite.opacity -= dOpacity

            if (sprite.opacity <= 0) {
                sprite.opacity = 0
                pledge.resolve()
                return STOP_CALLBACKS
            }
            return
        })
        return pledge
    }

    export function smoothPut(
        body: Body,
        location: ILevelLocation2
    ): PromiseLike<void> {
        const ghost = createGhost(body, body)

        // If either finishes, we don't want the other to continue
        function clearBoth() {
            ghost.clearLevel()
            body.fadeEnteringLevelPromise = null
        }

        fadeOutBody(ghost).then(clearBoth)
        body.putInLocation(location)
        body.fadeEnteringLevelPromise = new Pledge()
        return body.fadeEnteringLevelPromise.then(clearBoth)
    }
}