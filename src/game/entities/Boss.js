import Phaser from 'phaser';
import { EnemyState, default as EnemyBase } from './EnemyBase.js';
import { ENEMY, GAME_HEIGHT } from '../config.js';

// Boss — 三阶段巨型敌人
export default class Boss extends EnemyBase {
  constructor(scene, x, y) {
    super(scene, x, y, 'boss', {
      maxHealth: 9,
      contactDamage: 1,
      moveSpeed: 60,
    });

    // 更大的碰撞体
    this.body.setSize(56, 56);
    this.body.setOffset(4, 8);

    // Boss 血条引用
    this.bossHealthBar = null;

    // 攻击参数
    this.chargeSpeed = 200;
    this.attackTimer = 0;
    this.phaseAttackCooldown = 2000;

    // 召唤小兵计数
    this.minionsSpawned = 0;

    this.setState(EnemyState.IDLE);
  }

  // 当前阶段
  getPhase() {
    const pct = this.healthSystem.getHealthPercent();
    if (pct > 0.66) return 1;
    if (pct > 0.33) return 2;
    return 3;
  }

  updateAI(player, time, delta) {
    if (this.attackTimer > 0) {
      this.attackTimer -= delta;
    }

    // 始终面向玩家
    this.patrolDir = player.x > this.x ? 1 : -1;

    const dist = this.distanceToPlayer(player);
    const phase = this.getPhase();

    switch (this.state) {
      case EnemyState.IDLE:
        if (dist < 400) {
          this.setState(EnemyState.CHASE);
        }
        break;

      case EnemyState.CHASE:
        // 慢慢走向玩家
        // 攻击冷却好了 → 攻击
        if (this.attackTimer <= 0) {
          this.chooseAttack(player, phase);
        }
        break;

      case EnemyState.ATTACK:
        // 攻击执行中，由具体攻击方法控制
        break;

      default:
        break;
    }

    // 更新 Boss 血条
    if (this.bossHealthBar) {
      this.bossHealthBar.update(this.healthSystem.getHealth());
    }
  }

  // 根据阶段选择攻击
  chooseAttack(player, phase) {
    // 攻击冷却
    const baseCooldown = this.phaseAttackCooldown;
    const cooldown = phase === 3 ? baseCooldown * 0.6 : baseCooldown;
    this.attackTimer = cooldown;

    if (phase === 1) {
      // 阶段 1：冲刺攻击
      this.doChargeAttack(player);
    } else if (phase === 2) {
      // 阶段 2：冲刺或跳砸
      Math.random() < 0.5 ? this.doChargeAttack(player) : this.doJumpSlam(player);
    } else {
      // 阶段 3：狂暴，偶尔召唤小兵
      const r = Math.random();
      if (r < 0.4) this.doChargeAttack(player);
      else if (r < 0.75) this.doJumpSlam(player);
      else this.spawnMinion();
    }
  }

  // 冲刺攻击
  doChargeAttack(player) {
    this.setState(EnemyState.ATTACK);
    this.setVelocityX(0);

    // 蓄力闪烁
    this.setTint(0xff8888);

    this.scene.time.delayedCall(500, () => {
      if (this.state !== EnemyState.ATTACK) return;
      this.clearTint();
      const dir = player.x > this.x ? 1 : -1;
      this.setVelocityX(dir * this.chargeSpeed);

      // 冲刺结束后回到追击
      this.scene.time.delayedCall(600, () => {
        if (this.state === EnemyState.ATTACK) {
          this.setVelocityX(0);
          this.setState(EnemyState.CHASE);
        }
      });
    });
  }

  // 跳跃重砸
  doJumpSlam(player) {
    this.setState(EnemyState.ATTACK);
    this.setVelocityX(0);

    // 蓄力
    this.setTint(0xff8888);

    this.scene.time.delayedCall(400, () => {
      if (this.state !== EnemyState.ATTACK) return;
      this.clearTint();

      // 跳向玩家
      this.setVelocityY(-500);
      this.setVelocityX((player.x - this.x) * 0.8);

      // 落地检测
      const checkLand = this.scene.time.addEvent({
        delay: 50,
        loop: true,
        callback: () => {
          const onGround = this.body.blocked.down || this.body.touching.down;
          if (onGround && this.state === EnemyState.ATTACK) {
            checkLand.destroy();
            this.setVelocityX(0);
            this.setVelocityY(0);

            // 震荡波
            this.createShockwave();

            // 短暂僵直
            this.scene.time.delayedCall(300, () => {
              if (this.state === EnemyState.ATTACK) {
                this.setState(EnemyState.CHASE);
              }
            });
          }
        },
      });
    });
  }

  // 地面震荡波
  createShockwave() {
    const groundY = GAME_HEIGHT - 16;

    // 向左和向右各一个波纹
    [-1, 1].forEach(dir => {
      const wave = this.scene.add.rectangle(this.x, groundY, 8, 12, 0xff4422);
      wave.setDepth(15);

      this.scene.tweens.add({
        targets: wave,
        x: this.x + dir * 250,
        scaleX: 8,
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => wave.destroy(),
      });

      // 震荡波也会伤到玩家（通过重叠检测）
      // 简化处理：如果玩家在范围内直接扣血
      this.scene.time.delayedCall(200, () => {
        if (!this.scene.player || this.scene.player._isDead) return;
        const dist = Math.abs(this.scene.player.x - this.x);
        const playerY = this.scene.player.y;
        if (dist < 200 && playerY > GAME_HEIGHT - 80) {
          if (!this.scene.player.invincible) {
            this.scene.player.takeDamage(1);
            this.scene.player.setVelocityY(-300);
          }
        }
      });
    });

    // 屏幕震动
    this.scene.cameras.main.shake(200, 0.015);
  }

  // 召唤小兵
  spawnMinion() {
    if (this.minionsSpawned >= 2) return; // 最多召唤 2 次
    this.minionsSpawned++;

    // 在 Boss 两侧各生成一个追踪兵
    [-1, 1].forEach(dir => {
      if (this.scene.spawnMinion) {
        this.scene.spawnMinion(this.x + dir * 80, this.y);
      }
    });
  }

  // 重写死亡
  die() {
    // 提前捕获引用（super.die() 300ms 后会 destroy this）
    const scene = this.scene;
    const healthBar = this.bossHealthBar;

    super.die();

    // Boss 血条归零
    if (healthBar) {
      healthBar.update(0);
      scene.time.delayedCall(500, () => {
        healthBar.hide();
      });
    }

    // 触发胜利
    scene.time.delayedCall(1500, () => {
      console.log('Boss 死亡回调触发！');
      scene.onBossDefeated();
    });
  }

  // 重写执行状态
  executeState(player, time, delta) {
    switch (this.state) {
      case EnemyState.CHASE:
        // 慢慢走向玩家
        this.setVelocityX(this.moveSpeed * this.patrolDir);
        break;
      case EnemyState.IDLE:
        this.setVelocityX(0);
        break;
      default:
        super.executeState(player, time, delta);
        break;
    }
  }
}
