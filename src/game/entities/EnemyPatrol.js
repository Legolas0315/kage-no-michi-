import { EnemyState, default as EnemyBase } from './EnemyBase.js';
import { ENEMY } from '../config.js';

// 巡逻兵 — 固定范围左右往返，不追踪玩家
export default class EnemyPatrol extends EnemyBase {
  constructor(scene, x, y, patrolLeftX, patrolRightX) {
    super(scene, x, y, 'enemy_patrol', {
      maxHealth: 2,
      contactDamage: 1,
      moveSpeed: ENEMY.PATROL_SPEED,
    });

    this.patrolLeftX = patrolLeftX;
    this.patrolRightX = patrolRightX;

    // 初始状态：巡逻
    this.setState(EnemyState.PATROL);
  }

  updateAI(player) {
    // 巡逻兵只做巡逻，到达边界后转身
    if (this.state === EnemyState.PATROL) {
      if (this.x >= this.patrolRightX) {
        this.patrolDir = -1;
        this.setVelocityX(this.moveSpeed * this.patrolDir);
      } else if (this.x <= this.patrolLeftX) {
        this.patrolDir = 1;
        this.setVelocityX(this.moveSpeed * this.patrolDir);
      }
      // 保持方向更新（executePatrol 只设一次速度，这里持续更新防止被物理干扰）
    }
  }

  // 重写：巡逻兵在巡逻时持续设速，确保不受碰撞干扰
  executeState(player, time, delta) {
    if (this.state === EnemyState.PATROL) {
      this.setVelocityX(this.moveSpeed * this.patrolDir);
    } else {
      super.executeState(player, time, delta);
    }
  }
}
