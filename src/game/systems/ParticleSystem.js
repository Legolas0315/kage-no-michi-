import Phaser from 'phaser';

// 粒子特效系统 — 用 tween + 小方块模拟粒子效果
export default class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
  }

  // 命中火花：向四周飞散
  emitSparks(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 40 + Math.random() * 60;
      const size = 2 + Math.random() * 3;

      const spark = this.scene.add.rectangle(x, y, size, size, 0xffdd44);
      spark.setDepth(50);

      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 200 + Math.random() * 150,
        ease: 'Power2',
        onComplete: () => spark.destroy(),
      });
    }
  }

  // 死亡爆炸：红色粒子向外扩散
  emitExplosion(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 30 + Math.random() * 50;
      const size = 3 + Math.random() * 5;
      const colors = [0xff4444, 0xff6644, 0xffaa44, 0xffff44];

      const particle = this.scene.add.rectangle(
        x, y, size, size, colors[Math.floor(Math.random() * colors.length)]
      );
      particle.setDepth(50);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed - 10,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 300 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }

    // 中心闪光
    const flash = this.scene.add.circle(x, y, 15, 0xffffff, 0.8);
    flash.setDepth(49);
    this.scene.tweens.add({
      targets: flash,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    });
  }

  // 落地烟尘：向下飘散
  emitDust(x, y) {
    for (let i = 0; i < 4; i++) {
      const dust = this.scene.add.rectangle(
        x + (Math.random() - 0.5) * 16,
        y,
        3 + Math.random() * 3,
        3 + Math.random() * 3,
        0x8b7355
      );
      dust.setDepth(10);

      this.scene.tweens.add({
        targets: dust,
        x: dust.x + (Math.random() - 0.5) * 20,
        y: dust.y + 10 + Math.random() * 10,
        alpha: 0,
        duration: 300 + Math.random() * 200,
        ease: 'Power1',
        onComplete: () => dust.destroy(),
      });
    }
  }

  // 收集闪光：白色粒子螺旋上升
  emitCollect(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const particle = this.scene.add.rectangle(x, y, 3, 3, 0xffffee);
      particle.setDepth(50);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 20,
        y: y + Math.sin(angle) * 20 - 15,
        alpha: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 250 + Math.random() * 150,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }

    // 中心光圈
    const ring = this.scene.add.circle(x, y, 5, 0xffffcc, 0.6);
    ring.setDepth(49);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy(),
    });
  }

  // 落地冲击波
  emitLanding(x, y) {
    const ring = this.scene.add.circle(x, y, 4, 0xffffff, 0.3);
    ring.setDepth(10);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 250,
      onComplete: () => ring.destroy(),
    });
    this.emitDust(x, y);
  }
}
