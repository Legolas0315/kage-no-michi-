import Phaser from 'phaser';
import { TRAP } from '../config.js';

// 地刺陷阱 — 碰到扣血 + 向上弹飞
export default class Trap extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, tiles = 1) {
    super(scene, x, y, 'trap');

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // 静态物理体

    this.body.setSize(32 * tiles, 14);
    this.body.setOffset(0, 1);
    this.damage = TRAP.DAMAGE;
    this.knockbackY = TRAP.KNOCKBACK_Y;

    // 如果多格，缩放或拉伸（用 scaleX 拉伸更简单）
    if (tiles > 1) {
      this.setDisplaySize(32 * tiles, 16);
    }
  }
}
