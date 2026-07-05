import Phaser from 'phaser';
import { SOUL } from '../config.js';

export default class CombatSystem {
  constructor(scene) {
    this.scene = scene;

    this.attackCooldown = 300;
    this.attackTimer = 0;

    this.hitboxWidth = 48;
    this.hitboxHeight = 40;
    this.hitboxDuration = 200;

    this.player = null;
    this.enemies = null;
    this.soulGauge = null;
    this.soundSystem = null;
    this.particleSystem = null;
  }

  setup(player, enemies, soulGauge, soundSystem, particleSystem) {
    this.player = player;
    this.enemies = enemies;
    this.soulGauge = soulGauge;
    this.soundSystem = soundSystem;
    this.particleSystem = particleSystem;

    this.scene.physics.add.overlap(
      this.player, this.enemies,
      this.onPlayerTouchEnemy, null, this
    );
  }

  setupArrows(arrowsGroup) {
    this.scene.physics.add.overlap(
      this.player, arrowsGroup,
      this.onArrowHitPlayer, null, this
    );
  }

  onArrowHitPlayer(player, arrow) {
    if (!arrow.active) return;
    if (player.invincible) return;

    player.takeDamage(1);
    const knockDir = arrow.body.velocity.x > 0 ? 1 : -1;
    player.setVelocityX(knockDir * 150);
    player.setVelocityY(-150);
    arrow.destroy();

    // 特效
    if (this.particleSystem) this.particleSystem.emitSparks(arrow.x, arrow.y, 4);
    if (this.soundSystem) this.soundSystem.playDamage();
  }

  playerAttack() {
    if (this.attackTimer > 0) return;
    if (!this.player || this.player.isDashing) return;

    this.attackTimer = this.attackCooldown;

    const offsetX = this.player.facing * 28;
    this.createHitbox(this.player.x + offsetX, this.player.y, this.player.facing);

    // 挥刀音效
    if (this.soundSystem) this.soundSystem.playSlash();
  }

  createHitbox(x, y, facing) {
    const hitbox = this.scene.physics.add.sprite(x, y, 'slash');
    hitbox.setFlipX(facing === -1);
    hitbox.body.setAllowGravity(false);
    hitbox.setDepth(10);

    const hitEnemies = new Set();

    const overlap = this.scene.physics.add.overlap(
      hitbox, this.enemies,
      (hitboxObj, enemy) => {
        if (hitEnemies.has(enemy)) return;
        hitEnemies.add(enemy);
        this.onAttackHit(enemy, facing, hitbox);
      },
      null, this
    );

    this.scene.time.delayedCall(this.hitboxDuration, () => {
      overlap.destroy();
      hitbox.destroy();
    });
  }

  onAttackHit(enemy, facing, hitbox) {
    if (!enemy.active) return;

    enemy.takeDamage(1, this.player.x);

    if (this.soulGauge) this.soulGauge.add(SOUL.PER_HIT);

    // === 打击反馈 ===

    // 命中火花
    if (this.particleSystem) {
      this.particleSystem.emitSparks(hitbox.x, hitbox.y, 6);
    }

    // 屏幕震动
    this.scene.cameras.main.shake(80, 0.005);

    // 命中音效
    if (this.soundSystem) this.soundSystem.playHit();

    // Hit stop：物理短暂暂停
    this.scene.physics.world.isPaused = true;
    this.scene.time.delayedCall(40, () => {
      this.scene.physics.world.isPaused = false;
    });
  }

  onPlayerTouchEnemy(player, enemy) {
    if (!enemy.active) return;
    if (player.invincible) return;

    player.takeDamage(enemy.contactDamage || 1);

    const knockDir = player.x < enemy.x ? 1 : -1;
    player.setVelocityX(knockDir * 200);
    player.setVelocityY(-200);

    // 特效
    if (this.particleSystem) this.particleSystem.emitSparks(player.x, player.y, 3);
    this.scene.cameras.main.shake(150, 0.01);
  }

  update(delta) {
    if (this.attackTimer > 0) {
      this.attackTimer -= delta;
    }
  }
}
