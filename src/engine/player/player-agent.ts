import { AbilityPool } from "./ability/ability-pool";
import { ControlledCollisionMovement } from "../world/body/agent/controlled-collision-movement-agent";
import { LocationHistory } from "./location-history";
import { PlayerManager } from "./player-manager";
import { JoyStick } from "../ui/controls/joy-stick";
import { MeteredStat } from "./metered-stat";
import { IAbility } from "./ability/ability";
import { direction_t } from "engine/math/direction";
import { Indirect } from "engine/redirect";
import { TimeNotified, game_seconds } from "engine/time/timeline";
import { SpriteBody } from "engine/world/body/sprite-body";
import { Body } from "engine/world/body/body";

const ATTACK_ABILITY = "ATTACK_ABILITY";
const JUMP_ABILITY = "JUMP_ABILITY";
const SPECIAL_ABILITY = "SPECIAL_ABILITY";
export class PlayerAgent implements TimeNotified {
    readonly abilities: AbilityPool;
    movementAgent: ControlledCollisionMovement;
    speed: Indirect<number> = 32;
    walkStance: string = "walk";
    readonly locationHistory = new LocationHistory(128);
    constructor(private readonly playerManager: PlayerManager, private readonly joyStick: JoyStick, readonly spriteBody: SpriteBody, readonly stamina: MeteredStat | null = null) {
        this.abilities = new AbilityPool(spriteBody.body);
        this.movementAgent = new ControlledCollisionMovement(spriteBody);
    }
    get body(): Body {
        return this.spriteBody.body;
    }
    setJumpAbility(ability: IAbility) {
        this.abilities.set(JUMP_ABILITY, ability, 0.0);
    }
    setSpecialAbility(ability: IAbility) {
        this.abilities.set(SPECIAL_ABILITY, ability, 0.1);
    }
    setAttackAbility(ability: IAbility) {
        this.abilities.set(ATTACK_ABILITY, ability, 0.1);
    }
    doJump() {
        this.useAbility(JUMP_ABILITY);
    }
    doSpecial() {
        this.useAbility(SPECIAL_ABILITY);
    }
    doAttack() {
        this.useAbility(ATTACK_ABILITY);
    }
    useAbility(ability: string): void {
        if (!this.isFrozen()) {
            this.abilities.use(ability);
        }
    }
    setLadder(eventId: string, direction: direction_t) {
        this.movementAgent.setLadder(eventId, direction);
    }
    isFrozen(): boolean {
        return this.playerManager.controlsLocked || this.abilities.isFrozen() || (this.stamina !== null && this.stamina.isEmpty());
    }
    notifyTimeAdvance(delta: game_seconds) {
        if (this !== this.playerManager.getActive()) {
            this.movementAgent.setStopped();
            return;
        }
        var dir = this.joyStick.getDirection();
        if (dir === null) {
            this.movementAgent.setStopped();
        }
        else {
            this.movementAgent.setWalkingDirection(dir);
            this.movementAgent.speed = this.speed;
            this.movementAgent.stance = this.walkStance;
        }
        if (!this.isFrozen() && this.spriteBody.body.getLevel().isLoaded()) {
            this.movementAgent.notifyTimeAdvance(delta);
        }
        this.locationHistory.push(this.body);
    }
}
