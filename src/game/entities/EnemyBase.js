import Phaser from 'phaser';
import HealthSystem from '../systems/HealthSystem.js';
import { ENEMY } from '../config.js';

// 敌人状态常量
export const EnemyState = {
  IDLE: 'idle',
  PATROL: 'patrol',
  CHASE: 'chase',
  ATTACK: 'attack',
  HURT: 'hurt',
  DEAD: 'dead',
};

// 敌人基类 — 状态机 + 通用逻辑，子类重写 updateAI()
export default class EnemyBase extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, config = {}) {
    super(scene, x, y, textureKey);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 物理体
    this.body.setSize(28, 28);
    this.body.setOffset(2, 4);
    this.setCollideWorldBounds(true);

    // 生命值
    const maxHealth = config.maxHealth || 2;
    this.healthSystem = new HealthSystem(maxHealth);

    // 接触伤害
    this.contactDamage = config.contactDamage || 1;

    // 速度
    this.moveSpeed = config.moveSpeed || ENEMY.PATROL_SPEED;
    this.patrolDir = 1; // 巡逻方向：1=右，-1=左

    // 受伤
    this.isHurting = false;
    this.knockbackForce = 150;

    // 状态机
    this.state = EnemyState.IDLE;
    this.prevState = null;

    console.log(`${textureKey} 就绪 — HP: ${maxHealth}`);
  }

  // === 状态机 ===

  setState(newState) {
    if (this.state === EnemyState.DEAD) return; // 死亡后不能切换
    if (this.state === newState) return;

    this.prevState = this.state;
    this.state = newState;
  }

  // === 主更新（子类一般不需要重写） ===

  update(time, delta, player) {
    if (this.state === EnemyState.DEAD) return;

    // 受伤硬直中不执行 AI
    if (this.state !== EnemyState.HURT) {
      this.updateAI(player, time, delta);
    }

    // 根据状态执行行为
    this.executeState(player, time, delta);
  }

  // === 子类重写此方法实现 AI ===

  updateAI(player, time, delta) {
    // 默认为空，子类实现
  }

  // === 状态行为 ===

  executeState(player, time, delta) {
    switch (this.state) {
      case EnemyState.IDLE:
        this.setVelocityX(0);
        break;
      case EnemyState.PATROL:
        this.executePatrol();
        break;
      case EnemyState.CHASE:
        this.executeChase(player);
        break;
      case EnemyState.ATTACK:
        this.executeAttack(player);
        break;
      case EnemyState.HURT:
        // 击退中，不做额外行为
        break;
      default:
        break;
    }
  }

  executePatrol() {
    this.setVelocityX(this.moveSpeed * this.patrolDir);
  }

  executeChase(player) {
    // 朝玩家移动
    const dir = player.x > this.x ? 1 : -1;
    this.setVelocityX(ENEMY.CHASE_SPEED * dir);
    this.patrolDir = dir;
  }

  executeAttack(player) {
    // 默认攻击：短暂停顿后冲向玩家
    this.setVelocityX(0);

    // 延迟后冲刺
    this.scene.time.delayedCall(200, () => {
      if (this.state !== EnemyState.ATTACK) return;
      const dir = player.x > this.x ? 1 : -1;
      this.setVelocityX(ENEMY.CHASE_SPEED * 2 * dir);
    });
  }

  // === 获取到玩家的距离 ===

  distanceToPlayer(player) {
    return Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
  }

  // === 受伤 ===

  takeDamage(amount, attackerX) {
    if (this.isHurting || this.healthSystem.isDead()) return;

    const isDead = this.healthSystem.takeDamage(amount);
    this.isHurting = true;
    this.setState(EnemyState.HURT);

    // 击退
    const knockDir = this.x > attackerX ? 1 : -1;
    this.setVelocityX(knockDir * this.knockbackForce);

    // 闪烁
    this.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
      this.isHurting = false;
      this.setVelocityX(0);

      if (!this.healthSystem.isDead()) {
        // 恢复巡逻
        this.setState(EnemyState.PATROL);
      }
    });

    console.log(`敌人受到 ${amount} 点伤害，剩余 HP: ${this.healthSystem.getHealth()}`);

    if (isDead) {
      this.die();
    }
  }

  // === 死亡 ===

  die() {
    this.setState(EnemyState.DEAD);
    this.setVelocityX(0);
    this.setVelocityY(0);
    this.body.enable = false;

    console.log('敌人被击败！');

    // 特效和音效
    if (this.scene.particleSystem) {
      this.scene.particleSystem.emitExplosion(this.x, this.y);
    }
    if (this.scene.soundSystem) {
      this.scene.soundSystem.playEnemyDeath();
    }

    // 屏幕震动
    this.scene.cameras.main.shake(200, 0.008);

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 300,
      onComplete: () => {
        this.destroy();
      },
    });
  }
}
