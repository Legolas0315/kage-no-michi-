import Phaser from 'phaser';
import { SOUL } from '../config.js';

// 灵魂球收集品 — 拾取加气 + 消失动画
export default class Collectible extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'collectible');

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // 静态

    this.soulAmount = SOUL.COLLECTIBLE_AMOUNT;
    this.collected = false;

    // 上下浮动动画
    scene.tweens.add({
      targets: this,
      y: y - 8,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 微光呼吸
    scene.tweens.add({
      targets: this,
      alpha: 0.6,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  // 被玩家拾取
  collect() {
    if (this.collected) return;
    this.collected = true;

    // 音效和粒子
    if (this.scene.soundSystem) this.scene.soundSystem.playCollect();
    if (this.scene.particleSystem) this.scene.particleSystem.emitCollect(this.x, this.y);

    // 拾取动画：放大 + 消失
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.destroy();
      },
    });

    this.body.enable = false;
  }
}
