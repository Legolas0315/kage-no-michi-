import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

// 胜利画面
export default class WinScene extends Phaser.Scene {
  constructor() {
    super('Win');
  }

  init(data) {
    this.clearTime = (data && data.clearTime) ? data.clearTime : 0;
    console.log('WinScene init, 通关时间:', this.clearTime);
  }

  create() {
    // 黑色背景
    this.cameras.main.setBackgroundColor('#0a0a0a');
    this.cameras.main.fadeIn(500);

    // 标题
    this.add.text(GAME_WIDTH / 2, 180, '影 帰 於 闇', {
      fontSize: '52px',
      fontFamily: 'serif',
      color: '#e8d5b0',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 240, 'The shadow returns to darkness', {
      fontSize: '16px',
      fontFamily: 'serif',
      color: '#8b7355',
    }).setOrigin(0.5);

    // 通关时间
    const minutes = Math.floor(this.clearTime / 60000);
    const seconds = Math.floor((this.clearTime % 60000) / 1000);
    this.add.text(GAME_WIDTH / 2, 310, `通关时间  ${minutes}:${String(seconds).padStart(2, '0')}`, {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ccccaa',
    }).setOrigin(0.5);

    // 返回菜单提示
    const backText = this.add.text(GAME_WIDTH / 2, 430, '按 ENTER 返回主菜单', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#e8d5b0',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: backText,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once('keydown-ENTER', () => {
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => {
        this.scene.start('Menu');
      });
    });
  }
}
