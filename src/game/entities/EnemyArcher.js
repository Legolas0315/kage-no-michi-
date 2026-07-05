import { EnemyState, default as EnemyBase } from './EnemyBase.js';
import { ENEMY } from '../config.js';

// 弓箭手 — 站在高台上，玩家靠近时远程射击
export default class EnemyArcher extends EnemyBase {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy_archer', {
      maxHealth: 2,
      contactDamage: 1,
    });

    this.fireRange = ENEMY.ARCHER_FIRE_RANGE;
    this.fireCooldown = ENEMY.ARCHER_FIRE_COOLDOWN;
    this.fireTimer = 0;

    this.setState(EnemyState.IDLE);
  }

  updateAI(player, time, delta) {
    // 更新射击冷却
    if (this.fireTimer > 0) {
      this.fireTimer -= delta;
    }

    const dist = this.distanceToPlayer(player);
    const horizontalDist = Math.abs(player.x - this.x);

    switch (this.state) {
      case EnemyState.IDLE:
        // 玩家进入射击范围 → 攻击
        if (dist < this.fireRange && horizontalDist > 60) {
          this.setState(EnemyState.ATTACK);
        }
        break;

      case EnemyState.ATTACK:
        // 玩家逃出范围 → 回待机
        if (dist > this.fireRange * 1.3) {
          this.setState(EnemyState.IDLE);
          return;
        }
        // 冷却好了就射箭
        if (this.fireTimer <= 0) {
          this.fireArrow(player);
          this.fireTimer = this.fireCooldown;
        }
        break;

      default:
        break;
    }
  }

  // 发射弹幕
  fireArrow(player) {
    const dir = player.x > this.x ? 1 : -1;
    const arrowX = this.x + dir * 20;
    const arrowY = this.y - 4;

    if (this.scene.createArrow) {
      this.scene.createArrow(arrowX, arrowY, dir);
    }
  }

  // 重写：弓箭手在 ATTACK 时不冲锋，原地射击
  executeState(player, time, delta) {
    switch (this.state) {
      case EnemyState.IDLE:
      case EnemyState.ATTACK:
        // 原地不动，不冲锋
        this.setVelocityX(0);
        break;
      case EnemyState.HURT:
        break;
      default:
        super.executeState(player, time, delta);
        break;
    }
  }
}
