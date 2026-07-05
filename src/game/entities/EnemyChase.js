import { EnemyState, default as EnemyBase } from './EnemyBase.js';
import { ENEMY } from '../config.js';

// 追踪兵 — 巡逻时发现玩家后追击，近距离攻击
export default class EnemyChase extends EnemyBase {
  constructor(scene, x, y, patrolLeftX, patrolRightX) {
    super(scene, x, y, 'enemy_chase', {
      maxHealth: 2,
      contactDamage: 1,
      moveSpeed: ENEMY.PATROL_SPEED,
    });

    this.patrolLeftX = patrolLeftX;
    this.patrolRightX = patrolRightX;

    // 攻击冷却
    this.attackCooldown = ENEMY.ATTACK_COOLDOWN;
    this.attackTimer = 0;

    this.setState(EnemyState.PATROL);
  }

  updateAI(player, time, delta) {
    // 更新攻击冷却
    if (this.attackTimer > 0) {
      this.attackTimer -= delta;
    }

    const dist = this.distanceToPlayer(player);

    switch (this.state) {
      case EnemyState.PATROL:
        // 巡逻边界转身
        if (this.x >= this.patrolRightX) this.patrolDir = -1;
        else if (this.x <= this.patrolLeftX) this.patrolDir = 1;

        // 玩家进入侦测范围 → 追击
        if (dist < ENEMY.DETECTION_RANGE) {
          this.setState(EnemyState.CHASE);
        }
        break;

      case EnemyState.CHASE:
        // 玩家逃出范围 → 回巡逻
        if (dist > ENEMY.DETECTION_RANGE * 1.5) {
          this.setState(EnemyState.PATROL);
          return;
        }
        // 进入攻击范围 → 攻击
        if (dist < ENEMY.ATTACK_RANGE + 30 && this.attackTimer <= 0) {
          this.setState(EnemyState.ATTACK);
          this.attackTimer = this.attackCooldown;
        }
        break;

      case EnemyState.ATTACK:
        // 攻击后短暂追击延迟，然后回到追击状态
        this.scene.time.delayedCall(400, () => {
          if (this.state === EnemyState.ATTACK) {
            this.setState(EnemyState.CHASE);
          }
        });
        break;

      default:
        break;
    }
  }

  // 重写巡逻行为（追踪兵巡逻时也需要持续更新方向）
  executeState(player, time, delta) {
    switch (this.state) {
      case EnemyState.PATROL:
        this.setVelocityX(this.moveSpeed * this.patrolDir);
        break;
      case EnemyState.CHASE:
        this.setVelocityX(ENEMY.CHASE_SPEED * (player.x > this.x ? 1 : -1));
        break;
      default:
        super.executeState(player, time, delta);
        break;
    }
  }
}
