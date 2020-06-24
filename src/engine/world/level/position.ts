namespace splitTime {
    export class Position implements ILevelLocation, ILevelLocation2 {
        private readonly pathsToOtherPositions: PathToPosition[] = []
        constructor(
            readonly level: Level,
            readonly x: number,
            readonly y: number,
            readonly z: number,
            readonly dir: number,
            readonly stance: string
        ) {
        }

        getLevel() {
            return this.level
        }
        getX(): number {
            return this.x
        }
        getY(): number {
            return this.y
        }
        getZ(): number {
            return this.z
        }

        // TODO: need to make 3D coordinates here
        registerPath(otherPosition: Position, path: Coordinates2D[]): void {
            this.pathsToOtherPositions.push(new PathToPosition(otherPosition, path))
        }

        getPathTo(coordinates: Coordinates2D): Coordinates2D[] {
            for (const p of this.pathsToOtherPositions) {
                if (level.areCoordinatesEquivalent(coordinates, p.otherPosition)) {
                    return p.path
                }
            }
            return []
        }
    }

    class PathToPosition {
        constructor(
            public readonly otherPosition: Position,
            public readonly path: Coordinates2D[]
        ) {}
    }
}
