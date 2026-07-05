import Phaser from 'phaser';
import { COLORS } from '../config.js';

// 面具血条 — Hollow Knight 风格，左上角固定显示
export default class HealthBar {
  constructor(scene, maxHealth) {
    this.scene = scene;
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;

    // 容器位置：左上角
    this.x = 20;
    this.y = 20;
    this.maskRadius = 8;
    this.maskSpacing = 24;

    // 绘制所有面具
    this.masks = [];
    for (let i = 0; i < this.maxHealth; i++) {
      const maskX = this.x + i * this.maskSpacing;
      const mask = scene.add.graphics();
      mask.setScrollFactor(0); // 固定在屏幕上
      mask.setDepth(100);       // 始终在最上层
      this.drawMask(mask, maskX, this.y, true);
      this.masks.push(mask);
    }
  }

  // 绘制单个面具（实心或空心）
  drawMask(graphics, x, y, filled) {
    graphics.clear();
    if (filled) {
      // 实心白色面具
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(x, y, this.maskRadius);
      // 内圈深色
      graphics.fillStyle(0x999999);
      graphics.fillCircle(x - 2, y - 2, this.maskRadius * 0.35);
    } else {
      // 空心面具（仅边框）
      graphics.lineStyle(1.5, 0x666666);
      graphics.strokeCircle(x, y, this.maskRadius);
    }
  }

  // 更新血量显示
  update(health) {
    if (health === this.currentHealth) return;
    this.currentHealth = health;

    // 重新绘制每个面具
    for (let i = 0; i < this.maxHealth; i++) {
      const filled = i < health;
      const maskX = this.x + i * this.maskSpacing;
      this.drawMask(this.masks[i], maskX, this.y, filled);
    }

    // 受伤闪烁效果
    if (health < this.maxHealth) {
      this.flashDamage();
    }
  }

  // 受伤红色闪烁
  flashDamage() {
    const flash = this.scene.add.graphics();
    flash.setScrollFactor(0);
    flash.setDepth(99);
    flash.fillStyle(0xff0000, 0.3);
    flash.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });
  }
}
