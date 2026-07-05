import Phaser from 'phaser';
import { SOUL, COLORS } from '../config.js';

// 气槽 — 攻击命中积累，显示在血条下方
export default class SoulGauge {
  constructor(scene) {
    this.scene = scene;
    this.maxGauge = SOUL.MAX_GAUGE;
    this.currentSoul = 0;

    // 位置和尺寸
    this.x = 20;
    this.y = 48;
    this.width = 140;
    this.height = 12;
    this.borderRadius = 3;

    // 背景层（显示上限框 + 空槽底色）
    this.bgGraphics = scene.add.graphics();
    this.bgGraphics.setScrollFactor(0);
    this.bgGraphics.setDepth(100);
    this.drawBackground();

    // 填充层（蓝色气槽）
    this.fillGraphics = scene.add.graphics();
    this.fillGraphics.setScrollFactor(0);
    this.fillGraphics.setDepth(101);

    // 刻度标记层
    this.tickGraphics = scene.add.graphics();
    this.tickGraphics.setScrollFactor(0);
    this.tickGraphics.setDepth(102);
    this.drawTicks();

    // 标签
    this.label = scene.add.text(this.x - 2, this.y - 12, '気', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#8899cc',
    });
    this.label.setScrollFactor(0);
    this.label.setDepth(100);

    this.drawFill(0);
  }

  // 绘制背景：上限框 + 空槽
  drawBackground() {
    const g = this.bgGraphics;
    g.clear();

    // 外发光（上限框的视觉效果）
    g.fillStyle(0x224488, 0.3);
    g.fillRoundedRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4, this.borderRadius + 1);

    // 空槽底色（深色，显示"未填充的空间"）
    g.fillStyle(0x1a1a2e, 0.9);
    g.fillRoundedRect(this.x, this.y, this.width, this.height, this.borderRadius);

    // 上限框边框（亮色，始终可见 — 这就是"上限线"）
    g.lineStyle(1.5, 0x5588cc, 0.9);
    g.strokeRoundedRect(this.x, this.y, this.width, this.height, this.borderRadius);
  }

  // 绘制刻度线（25%、50%、75%）
  drawTicks() {
    const g = this.tickGraphics;
    g.clear();

    const ticks = [0.25, 0.5, 0.75, 1.0];
    ticks.forEach(pct => {
      const tx = this.x + this.width * pct;
      // 小竖线标记
      g.lineStyle(1, pct === 1.0 ? 0x5588cc : 0x334466, 0.7);
      g.lineBetween(tx, this.y + 2, tx, this.y + this.height - 2);
    });
  }

  // 绘制填充
  drawFill(percent) {
    const g = this.fillGraphics;
    g.clear();
    if (percent <= 0) return;

    const fillWidth = Math.min(this.width * (percent / 100), this.width);

    // 满气时颜色变化提示（超过 80% 微微偏亮）
    const fillColor = percent >= 100 ? 0x66aaff : (percent >= 80 ? 0x5599ff : COLORS.SOUL_GAUGE);

    // 蓝色气槽填充
    g.fillStyle(fillColor);
    g.fillRoundedRect(this.x, this.y, fillWidth, this.height, this.borderRadius);

    // 高光
    g.fillStyle(0xaaccff, 0.3);
    g.fillRoundedRect(this.x, this.y + 1, fillWidth, this.height / 2, {
      tl: this.borderRadius - 1,
      tr: this.borderRadius - 1,
      bl: 0,
      br: 0,
    });
  }

  // 增加气值
  add(amount) {
    this.currentSoul += amount;
    if (this.currentSoul > this.maxGauge) {
      this.currentSoul = this.maxGauge;
    }
    this.drawFill(this.currentSoul);

    // 满气时边框高亮一下
    if (this.currentSoul >= this.maxGauge) {
      this.flashFrame();
    }
  }

  // 消耗气值
  consume(amount) {
    if (this.currentSoul >= amount) {
      this.currentSoul -= amount;
      this.drawFill(this.currentSoul);
      return true;
    }
    return false;
  }

  // 满气时边框闪烁
  flashFrame() {
    const flash = this.scene.add.graphics();
    flash.setScrollFactor(0);
    flash.setDepth(103);
    flash.lineStyle(2, 0xaaddff, 1);
    flash.strokeRoundedRect(this.x, this.y, this.width, this.height, this.borderRadius);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy(),
    });
  }

  // 当前气值
  getSoulPercent() {
    return this.currentSoul;
  }
}
