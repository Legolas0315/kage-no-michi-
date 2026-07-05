import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

// 启动画面 — 简化为快速跳转菜单
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    // 背景色
    this.cameras.main.setBackgroundColor('#0a0a0a');

    // 标题
    this.add.text(GAME_WIDTH / 2, 220, '影 之 道', {
      fontSize: '64px',
      fontFamily: 'serif',
      color: '#e8d5b0',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 300, 'Kage no Michi', {
      fontSize: '22px',
      fontFamily: 'serif',
      color: '#6b5345',
    }).setOrigin(0.5);

    // 直接跳到菜单
    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(400);
      this.time.delayedCall(400, () => {
        this.scene.start('Menu');
      });
    });
  }
}
