import Phaser from 'phaser';

// 神社存档点 — 触碰激活，死亡后在此复活
export default class SavePoint extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'save_point');

    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    this.activated = false;

    // 未激活时暗淡
    this.setAlpha(0.4);
  }

  // 激活存档点
  activate() {
    if (this.activated) return;
    this.activated = true;

    // 视觉变化：变亮 + 脉冲
    this.setAlpha(1);
    this.setTint(0xffeebb);

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 300,
      yoyo: true,
      onComplete: () => {
        this.setScale(1);
        // 持续微微发光
        this.scene.tweens.add({
          targets: this,
          alpha: 0.7,
          duration: 1000,
          yoyo: true,
          repeat: -1,
        });
      },
    });

    // 粒子效果（简单：扩散光圈）
    const ring = this.scene.add.circle(this.x, this.y, 10, 0xffeebb, 0.6);
    ring.setDepth(5);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 800,
      onComplete: () => ring.destroy(),
    });

    console.log('神社激活 — 影在此留下印记');
  }
}
