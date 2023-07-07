import { direction_t, int } from "api"
import { Collage, Frame, Montage } from "engine/file/collage"
import { Immutable } from "engine/utils/immutable"
import { ImmutableSetter } from "../utils/preact-help"
import { type SimplifiedMontage } from "./properties-stuffs"

export class MontageWrapper implements SimplifiedMontage {

    private _id: string
    private readonly setCollageExternal: ImmutableSetter<Collage>

    constructor(
        initialMontage: Immutable<Montage>,
        private collage: Immutable<Collage>,
        setCollage: ImmutableSetter<Collage>
    ) {
        this._id = initialMontage.id
        this.setCollageExternal = setCollage
    }

    private setCollage(transform: (before: Immutable<Collage>) => Immutable<Collage>) {
        this.setCollageExternal((before) => {
            this.collage = transform(before)
            return this.collage
        })
    }

    private setMontage(newMontage: Partial<Immutable<Montage>>) {
        this.setCollage((before) => ({
            ...before,
            montages: before.montages.map(m => {
                if (m.id !== this.id) {
                    return m
                }
                return {
                    ...m,
                    ...newMontage,
                }
            }),
        }))
    }

    delete(): void {
        const id = this.id
        this.setCollage((before) => ({
            ...before,
            montages: before.montages.filter(m => m.id !== this.id)
        }))
    }

    get montage() {
        for (const m of this.collage.montages) {
            if (m.id === this.id) {
                return m
            }
        }
        throw new Error(`Montage ${this.id} not found in collage`)
    }

    get id() {
        return this._id
    }

    set id(newId: string) {
        if (newId === "") {
            throw new Error("Montage ID should not be blank")
        }

        if (newId === this.id) {
            return
        }

        const oldId = this._id
        for (const m of this.collage.montages) {
            if (m.id === newId) {
                throw new Error("Montage ID " + newId + " already taken")
            }
        }

        this.setMontage({id: newId})
        this._id = newId
    }

    get direction(): string {
        return this.montage.direction
    }
    set direction(newDirection: string) {
        this.setMontage({direction: newDirection})
    }

    get propPostProcessor(): string {
        return this.montage.propPostProcessor
    }
    set propPostProcessor(newValue: string) {
        this.setMontage({propPostProcessor: newValue})
    }

    get playerOcclusionFadeFactor(): number {
        return this.montage.playerOcclusionFadeFactor
    }
    set playerOcclusionFadeFactor(newFactor: number) {
        this.setMontage({playerOcclusionFadeFactor: newFactor})
    }
}
