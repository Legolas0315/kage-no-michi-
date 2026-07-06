import Phaser from 'phaser';
import { PLAYER, SOUL } from '../config.js';
import HealthSystem from '../systems/HealthSystem.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 物理体
    this.body.setSize(24, 44);
    this.body.setOffset(4, 4);

    // 移动
    this.moveSpeed = PLAYER.SPEED;
    this.jumpForce = PLAYER.JUMP_FORCE;

    // 冲刺
    this.dashSpeed = PLAYER.DASH_SPEED;
    this.dashDuration = PLAYER.DASH_DURATION;
    this.dashCooldown = PLAYER.DASH_COOLDOWN;
    this.dashCooldownTimer = 0;
    this.isDashing = false;
    this.dashTimer = 0;

    // 无敌帧
    this.invincible = false;
    this.invincibleTimer = 0;
    this.invincibleDuration = PLAYER.INVINCIBLE_DURATION;

    // 朝向
    this.facing = 1;

    // 生命系统
    this.healthSystem = new HealthSystem(PLAYER.MAX_HEALTH);

    // 气值
    this.soul = 0;

    // 死亡标记
    this._isDead = false;

    // 复活点（存档点激活后设置）
    this.respawnPoint = null;

    // UI 和系统引用（由 GameScene 设置）
    this.healthBar = null;
    this.soulGauge = null;
    this.soundSystem = null;
    this.particleSystem = null;

    console.log('玩家已就绪 — 影降临战场');
  }

  update(time, delta, cursors, wasd, jumpKey, dashKey) {
    // 冲刺中
    if (this.isDashing) {
      this.updateDash(delta);
      return;
    }

    // 冷却计时
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer -= delta;
    }

    // 无敌计时
    if (this.invincible) {
      this.invincibleTimer -= delta;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.setAlpha(1);
      }
    }

    // 输入处理
    this.handleMovement(cursors, wasd);
    this.handleJump(cursors, wasd, jumpKey);
    this.handleDash(dashKey);

    // 死亡检查
    if (this.healthSystem.isDead()) {
      this.die();
    }
  }

  // === 移动 ===

  handleMovement(cursors, wasd) {
    const left = cursors.left.isDown || wasd.left.isDown;
    const right = cursors.right.isDown || wasd.right.isDown;

    if (left && !right) {
      this.setVelocityX(-this.moveSpeed);
      this.facing = -1;
    } else if (right && !left) {
      this.setVelocityX(this.moveSpeed);
      this.facing = 1;
    } else {
      this.setVelocityX(0);
    }
  }

  // === 跳跃 ===

  handleJump(cursors, wasd, jumpKey) {
    const onGround = this.body.blocked.down || this.body.touching.down;

    const jumpDown = jumpKey.isDown || cursors.up.isDown || wasd.up.isDown;
    const jumpUp = jumpKey.isUp && cursors.up.isUp && wasd.up.isUp;

    if (jumpDown && onGround) {
      this.setVelocityY(this.jumpForce);
      if (this.soundSystem) this.soundSystem.playJump();
    }

    // 可变跳跃高度
    if (jumpUp && this.body.velocity.y < 0) {
      this.setVelocityY(this.body.velocity.y * 0.5);
    }
  }

  // === 冲刺 ===

  handleDash(dashKey) {
    if (Phaser.Input.Keyboard.JustDown(dashKey) && this.dashCooldownTimer <= 0) {
      this.isDashing = true;
      this.dashTimer = this.dashDuration;
      this.dashCooldownTimer = this.dashCooldown;

      this.invincible = true;
      this.invincibleTimer = this.dashDuration;

      this.setVelocityX(this.facing * this.dashSpeed);
      this.setVelocityY(0);

      this.setAlpha(0.5);

      if (this.soundSystem) this.soundSystem.playDash();

      console.log('冲刺！');
    }
  }

  updateDash(delta) {
    this.dashTimer -= delta;

    if (this.dashTimer <= 0) {
      this.isDashing = false;
      this.setVelocityX(this.facing * this.moveSpeed * 0.5);

      this.invincibleTimer = 200;
    }
  }

  // === 手里剑 ===

  fireShuriken() {
    // 从气槽读取真实值（Player.soul 未持续同步）
    const currentSoul = this.soulGauge ? this.soulGauge.currentSoul : this.soul;

    if (currentSoul < 25) {
      this.showHint('气不足！需要 25 气');
      return;
    }

    if (this.soulGauge) {
      this.soulGauge.currentSoul = currentSoul - 25;
      this.soulGauge.drawFill(currentSoul - 25);
    }
    this.soul = currentSoul - 25;

    const dir = this.facing;
    this.scene.createShuriken(this.x + dir * 24, this.y - 8, dir);
    console.log(`手里剑！剩余气: ${this.soul}`);
  }

  // === 聚气回血 ===

  heal() {
    if (this._isDead) return;

    // 血量已满
    if (this.healthSystem.getHealth() >= this.healthSystem.getMaxHealth()) {
      this.showHint('生命已满');
      return;
    }

    // 从气槽读取真实值
    const currentSoul = this.soulGauge ? this.soulGauge.currentSoul : this.soul;

    // 气不足
    if (currentSoul < SOUL.HEAL_COST) {
      this.showHint('气不足！需要 50 气');
      return;
    }

    // 消耗气
    if (this.soulGauge) {
      this.soulGauge.currentSoul = currentSoul - SOUL.HEAL_COST;
      this.soulGauge.drawFill(currentSoul - SOUL.HEAL_COST);
    }
    this.soul = currentSoul - SOUL.HEAL_COST;

    // 回血
    this.healthSystem.heal(1);
    if (this.healthBar) {
      this.healthBar.update(this.healthSystem.getHealth());
    }

    // 治疗音效
    if (this.soundSystem) this.soundSystem.playCollect();

    // 治疗闪光
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        if (!this.invincible) this.setAlpha(1);
      },
    });

    console.log(`聚气回血！消耗 50 气，当前 HP: ${this.healthSystem.getHealth()}`);
  }

  // 屏幕提示
  showHint(text) {
    const hint = this.scene.add.text(this.x, this.y - 40, text, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ff8888',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(200);

    this.scene.tweens.add({
      targets: hint,
      alpha: 0,
      y: hint.y - 30,
      duration: 1000,
      onComplete: () => hint.destroy(),
    });
  }

  // === 受伤 ===

  takeDamage(amount) {
    if (this.invincible || this._isDead) return;

    const isDead = this.healthSystem.takeDamage(amount);

    // 更新血条 UI
    if (this.healthBar) {
      this.healthBar.update(this.healthSystem.getHealth());
    }

    console.log(`玩家受到 ${amount} 点伤害，剩余 HP: ${this.healthSystem.getHealth()}`);

    // 受伤音效
    if (this.soundSystem) this.soundSystem.playDamage();

    if (isDead) {
      this.die();
      return;
    }

    // 受伤无敌帧 + 闪烁（没死才触发）
    this.invincible = true;
    this.invincibleTimer = this.invincibleDuration;

    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        if (!this.invincible) this.setAlpha(1);
      },
    });
  }

  // === 死亡 ===

  die() {
    if (this._isDead) return;
    this._isDead = true;

    console.log('玩家死亡 — 影消散于黑暗...');

    // 死亡音效
    if (this.soundSystem) this.soundSystem.playPlayerDeath();

    this.setVelocityX(0);
    this.setVelocityY(0);
    this.body.enable = false;

    // 死亡动画：上升 + 淡出
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 30,
      duration: 1000,
      onComplete: () => {
        // 有存档点 → 复活
        if (this.respawnPoint) {
          this.respawn();
        } else {
          this.gameOver();
        }
      },
    });
  }

  // 在存档点复活
  respawn() {
    console.log('神社之力 — 影重生于世...');

    // 恢复生命
    this.healthSystem = new HealthSystem(PLAYER.MAX_HEALTH);

    // 重置状态
    this._isDead = false;
    this.invincible = true;
    this.invincibleTimer = 2000; // 复活后 2 秒无敌
    this.setAlpha(0.5);

    // 移到存档点
    this.setPosition(this.respawnPoint.x, this.respawnPoint.y);
    this.body.enable = true;
    this.setVelocity(0, 0);

    // 更新 UI
    if (this.healthBar) {
      this.healthBar.update(this.healthSystem.getHealth());
    }

    // 复活动画：淡入
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 500,
    });

    // 显示"复活"文字
    const reviveText = this.scene.add.text(
      this.x,
      this.y - 50,
      '神 社 加 护',
      {
        fontSize: '24px',
        fontFamily: 'serif',
        color: '#ffdd88',
        stroke: '#000',
        strokeThickness: 2,
      }
    ).setOrigin(0.5).setAlpha(0);

    this.scene.tweens.add({
      targets: reviveText,
      alpha: 1,
      y: reviveText.y - 30,
      duration: 1000,
      onComplete: () => {
        this.scene.tweens.add({
          targets: reviveText,
          alpha: 0,
          duration: 500,
          onComplete: () => reviveText.destroy(),
        });
      },
    });

    console.log('复活完成！');
  }

  // 没有存档点 → 游戏结束
  gameOver() {
    console.log('游戏结束！');

    const deathText = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      '影 消 散 于 黑 暗 …',
      {
        fontSize: '36px',
        fontFamily: 'serif',
        color: '#cc3333',
        stroke: '#000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

    this.scene.tweens.add({
      targets: deathText,
      alpha: 1,
      duration: 800,
      onComplete: () => {
        this.scene.time.delayedCall(2000, () => {
          this.scene.scene.start('Menu');
        });
      },
    });
  }
}
