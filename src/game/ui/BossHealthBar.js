import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

// Boss 血条 — 屏幕顶部居中显示
export default class BossHealthBar {
  constructor(scene, maxHealth) {
    this.scene = scene;
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;

    // 位置和尺寸
    this.width = 300;
    this.height = 16;
    this.x = (GAME_WIDTH - this.width) / 2;
    this.y = 16;

    // 背景层
    this.bgGraphics = scene.add.graphics();
    this.bgGraphics.setScrollFactor(0);
    this.bgGraphics.setDepth(200);

    // 填充层
    this.fillGraphics = scene.add.graphics();
    this.fillGraphics.setScrollFactor(0);
    this.fillGraphics.setDepth(201);

    // 标签
    scene.add.text(GAME_WIDTH / 2, 38, 'BOSS', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#cc3333',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    this.draw();
    this.visible = false;
  }

  set visible(val) {
    this.bgGraphics.setVisible(val);
    this.fillGraphics.setVisible(val);
    this._visible = val;
  }

  show() {
    this.visible = true;
  }

  hide() {
    this.visible = false;
  }

  update(health) {
    this.currentHealth = health;
    this.draw();
  }

  draw() {
    // 背景
    const bg = this.bgGraphics;
    bg.clear();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRoundedRect(this.x, this.y, this.width, this.height, 4);
    bg.lineStyle(1.5, 0xcc3333, 0.9);
    bg.strokeRoundedRect(this.x, this.y, this.width, this.height, 4);

    // 填充
    const fg = this.fillGraphics;
    fg.clear();
    const pct = this.currentHealth / this.maxHealth;
    if (pct <= 0) return;

    const fillWidth = this.width * pct;

    // 阶段颜色变化
    let color;
    if (pct > 0.66) color = 0xcc3333;
    else if (pct > 0.33) color = 0xff6622;
    else color = 0xff2222;

    fg.fillStyle(color);
    fg.fillRoundedRect(this.x, this.y, fillWidth, this.height, 4);

    // 高光
    fg.fillStyle(0xffaaaa, 0.25);
    fg.fillRoundedRect(this.x, this.y + 1, fillWidth, this.height / 2, {
      tl: 3, tr: 3, bl: 0, br: 0,
    });
  }
}
