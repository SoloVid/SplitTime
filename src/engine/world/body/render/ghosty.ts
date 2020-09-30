namespace splitTime.body {
    export function createGhost(
        sourceBody: Body,
        location: ILevelLocation2
    ): Body {
        if (sourceBody.drawable === null) {
            throw new Error("Body doesn't have a drawable; so can't create ghost")
        }
        const tempDrawable = sourceBody.drawable.clone()
        const tempBody = new Body()
        tempBody.baseLength = 0
        tempBody.putInLocation(location)
        tempBody.drawable = tempDrawable
        return tempBody
    }

    export function fadeInBody(
        body: Body,
        startOpacity: number = 0,
        maxOpacity: number = 1,
        speed: number = 2
    ): PromiseLike<void> {
        const d = body.drawable
        if (d === null) {
            // Nothing to fade in
            return Pledge.as();
        }

        d.opacityModifier = startOpacity

        const pledge = new Pledge()
        body.registerTimeAdvanceListener(delta => {
            var dOpacity = speed * delta
            d.opacityModifier += dOpacity
            if (d.opacityModifier >= maxOpacity) {
                d.opacityModifier = maxOpacity
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
        const d = body.drawable
        if (d === null) {
            // Nothing to fade out
            return Pledge.as();
        }

        d.opacityModifier = startOpacity

        const pledge = new Pledge()
        body.registerTimeAdvanceListener(delta => {
            var dOpacity = speed * delta
            d.opacityModifier -= dOpacity

            if (d.opacityModifier <= 0) {
                d.opacityModifier = 0
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