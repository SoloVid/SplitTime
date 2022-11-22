import { IAbility } from "./ability";
import { ParticleEmitter } from "../../world/body/render/particles";
import { Color } from "../../light/color";
import { direction_t } from "engine/math/direction";
import { game_seconds } from "engine/time/timeline";
import { Pledge } from "engine/utils/pledge";
import { randomRanged } from "engine/utils/random";
import { STOP_CALLBACKS } from "engine/utils/register-callbacks";
import { CollisionMask, defaultCollisionMask, COLLISION_CALCULATOR } from "engine/world/body/collisions/collision-calculator";
import { InFrontOfBody } from "engine/world/body/in-front-of-body";
import { Body } from "engine/world/body/body";

export function knockBack(body: Body, dir: direction_t, speed: number, duration: game_seconds, zVelocityBump: number = 0): PromiseLike<void> {
    const pledge = new Pledge();
    let knockBackTime = 0;
    body.zVelocity = zVelocityBump;
    body.registerTimeAdvanceListener(delta => {
        if (!body.level.isLoaded() || knockBackTime > duration) {
            pledge.resolve();
            return STOP_CALLBACKS;
        }
        body.mover.zeldaBump(delta * speed, dir);
        knockBackTime += delta;
        return;
    });
    return pledge;
}
export class ParticleSlash implements IAbility {
    radiansWide: number = Math.PI * 0.5;
    radius: number = 24;
    hitBoxWidth: number = 16;
    collisionMask: CollisionMask = { ...defaultCollisionMask };
    duration: game_seconds = 0.08;
    extraParticleTime: number = 0.03;
    constructor(private readonly body: Body, private readonly onBodyHit: (body: Body) => void) { }
    use(): boolean {
        const slashBody = new Body();
        slashBody.width = 0;
        slashBody.depth = 0;
        const particles = new ParticleEmitter(slashBody, p => {
            p.position.x += randomRanged(-5, 5);
            p.position.y += randomRanged(-5, 5);
            p.radius = 6;
            p.color = new Color(100, 220, 255, 0.5);
            p.lightRadius = p.radius;
            p.lightIntensity = 0.05;
            p.maxAgeMs = 50;
            return p;
        });
        particles.generateIntervalMs = 5;
        particles.stopEmissionsAfter = (this.duration + this.extraParticleTime) * 1000;
        slashBody.drawables.push(particles);
        // slashBody.putInLocation(new splitTime.InFrontOfBody(this.body, 64))
        slashBody.putInLocation(this.body);
        let secondsPassed = 0;
        slashBody.registerTimeAdvanceListener(delta => {
            const angle = -((secondsPassed / this.duration) - 0.5) * this.radiansWide;
            slashBody.putInLocation(new InFrontOfBody(this.body, this.radius, angle, this.body.height * 0.5));
            secondsPassed += delta;
            if (secondsPassed > this.duration) {
                secondsPassed = this.duration;
                // TODO: stop (functionally) slash
            }
            else {
                const collisionInfo = COLLISION_CALCULATOR.calculateVolumeCollision(this.collisionMask, slashBody.level, slashBody.x - this.hitBoxWidth / 2, this.hitBoxWidth, slashBody.y - this.hitBoxWidth / 2, this.hitBoxWidth, slashBody.z - this.hitBoxWidth / 2, this.hitBoxWidth, [slashBody, this.body]);
                for (const b of collisionInfo.bodies) {
                    this.onBodyHit(b);
                    // TODO: remove after putting in game code
                    // G.attackEvent.trigger(b, {
                    //     direction: direction.fromRadians(direction.toRadians(this.body.dir, false), false),
                    //     damage: 5
                    // })
                }
            }
        });
        particles.registerParticlesGoneHandler(() => slashBody.clearLevel());
        return true;
    }
}
