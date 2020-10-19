namespace splitTime.agent {
    export type SetupFunc = (d: PathDsl) => void

    export type WalkOptions = {
        stance?: string
        ignorePaths?: boolean
    }

    export interface PathDsl {
        // TODO: going to need to add z coordinate (probably optional) to path traces for stairs
        walk(location: Readonly<Coordinates2D> | Readonly<Coordinates3D>, options?: WalkOptions): void
        transport(location: ILevelLocation2): void
        do(action: time.MidEventCallback): void
    }
}
