import { IAbility } from "./ability";
import { game_seconds } from "../../splitTime";
import { getFromBody } from "../../time/time-helper";
import * as splitTime from "../../splitTime";
interface AbilitySpec {
    ability: IAbility;
    coolDown: game_seconds;
}
export class AbilityPool {
    private freezeUntil: game_seconds = Number.NEGATIVE_INFINITY;
    private readonly abilityMap: {
        [type: string]: AbilitySpec | undefined;
    } = {};
    constructor(private readonly body: splitTime.Body) { }
    use(type: string): void {
        const spec = this.abilityMap[type];
        if (spec && !this.isFrozen()) {
            const used = spec.ability.use();
            if (used) {
                this.freezeUntil = getFromBody(this.body) + spec.coolDown;
            }
        }
    }
    has(type: string): boolean {
        return !!this.abilityMap[type];
    }
    unset(type: string): void {
        this.abilityMap[type] = undefined;
    }
    set(type: string, ability: IAbility, coolDown: game_seconds = 0): void {
        this.abilityMap[type] = {
            ability,
            coolDown
        };
    }
    isFrozen(): boolean {
        const now = getFromBody(this.body);
        return now <= this.freezeUntil;
    }
}
