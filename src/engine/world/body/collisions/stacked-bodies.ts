namespace splitTime.body {
    import BodyMoveProjection = splitTime.body.collisions.BodyMoveProjection
    import makeProjectionForBody = splitTime.body.collisions.makeProjectionForBody

    export function getAllStackedBodies(body: Body, ignoreBodies: readonly Body[] = []): readonly Body[] {
        // TODO: Some sort of validation that bodies are in valid (non-overlapping) state?
        const bodiesAbove = COLLISION_CALCULATOR.calculateVolumeCollision(
            body.collisionMask,
            body.level,
            body.getLeft(),
            body.width,
            body.getTopY(),
            body.depth,
            body.z + body.height,
            1
        ).bodies
        // Optimization attempt.
        if (bodiesAbove.length === 0) {
            return []
        }
        const directFound = bodiesAbove.filter(b => !ignoreBodies.includes(b))
        const output = [...directFound]
        for (const b of directFound) {
            output.push(...getAllStackedBodies(b, output))
        }
        return output
    }

    export function buildStackProjectionList(body: Body, parent?: BodyMoveProjection, soFar: readonly BodyMoveProjection[] = []): readonly BodyMoveProjection[] {
        const me = makeProjectionForBody(body)
        if (parent) {
            me.parents = [parent]
        }
        // TODO: Some sort of validation that bodies are in valid (non-overlapping) state?
        const bodiesAbove = COLLISION_CALCULATOR.calculateVolumeCollision(
            body.collisionMask,
            body.level,
            body.getLeft(),
            body.width,
            body.getTopY(),
            body.depth,
            body.z + body.height,
            1
        ).bodies
        let output: readonly BodyMoveProjection[] = [...soFar, me]
        for (const b of bodiesAbove) {
            let already = soFar.find(p => p.body === b)
            if (already) {
                already.parents = [...already.parents, me]
            } else {
                output = buildStackProjectionList(b, me, output)
            }
        }
        return output
    }
}
