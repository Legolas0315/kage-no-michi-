import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import SaveSystem from '../systems/SaveSystem.js';

// 完整主菜单 — 新游戏 / 继续 / 操作说明
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a0a');
    this.cameras.main.fadeIn(400);

    // 标题
    const title = this.add.text(GAME_WIDTH / 2, 160, '影 之 道', {
      fontSize: '64px',
      fontFamily: 'serif',
      color: '#e8d5b0',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // 呼吸动画
    this.tweens.add({
      targets: title,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.text(GAME_WIDTH / 2, 220, 'Kage no Michi', {
      fontSize: '18px',
      fontFamily: 'serif',
      color: '#6b5345',
    }).setOrigin(0.5);

    // 菜单选项
    this.menuItems = [
      { label: '新 游 戏', action: 'new', y: 290 },
    ];

    // 有存档才显示"继续"
    if (SaveSystem.exists()) {
      this.menuItems.push({ label: '继 续', action: 'continue', y: 330 });
    }

    this.selectedIndex = 0;
    this.menuTexts = [];

    this.menuItems.forEach((item, i) => {
      const text = this.add.text(GAME_WIDTH / 2, item.y, item.label, {
        fontSize: '26px',
        fontFamily: 'monospace',
        color: '#8b7355',
      }).setOrigin(0.5);
      this.menuTexts.push(text);
    });

    // 选择指示器
    this.selector = this.add.text(0, 0, '▶', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#cc4444',
    }).setOrigin(0.5);

    this.updateSelector();

    // 操作说明
    const controls = [
      'A / D 或 ← →  移动',
      '空格 / W / ↑  跳跃',
      'Shift  冲刺    J  攻击',
    ];

    controls.forEach((text, i) => {
      this.add.text(GAME_WIDTH / 2, 390 + i * 28, text, {
        fontSize: '15px',
        fontFamily: 'monospace',
        color: '#5a4a3a',
      }).setOrigin(0.5);
    });

    // 键盘输入
    this.cursors = this.input.keyboard.createCursorKeys();
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // 防止连续触发
    this.canConfirm = true;
  }

  update() {
    // ↑↓ 选择
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelector();
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.selectedIndex = Math.min(this.menuItems.length - 1, this.selectedIndex + 1);
      this.updateSelector();
    }

    // ENTER 确认
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) && this.canConfirm) {
      this.canConfirm = false;
      const action = this.menuItems[this.selectedIndex].action;
      this.confirm(action);
    }
  }

  updateSelector() {
    // 移动箭头到当前选中项左侧
    const item = this.menuItems[this.selectedIndex];
    this.selector.setPosition(GAME_WIDTH / 2 - 100, item.y);

    // 高亮选中项
    this.menuTexts.forEach((text, i) => {
      text.setColor(i === this.selectedIndex ? '#e8d5b0' : '#8b7355');
    });
  }

  confirm(action) {
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(300, () => {
      if (action === 'new') {
        SaveSystem.delete();
        this.scene.start('Game');
      } else if (action === 'continue') {
        this.scene.start('Game', { loadSave: true });
      }
    });
  }
}
