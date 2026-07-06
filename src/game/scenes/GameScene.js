import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, ENEMY, SOUL, TRAP } from '../config.js';
import Player from '../entities/Player.js';
import EnemyPatrol from '../entities/EnemyPatrol.js';
import EnemyChase from '../entities/EnemyChase.js';
import EnemyArcher from '../entities/EnemyArcher.js';
import Trap from '../entities/Trap.js';
import Collectible from '../entities/Collectible.js';
import SavePoint from '../entities/SavePoint.js';
import CombatSystem from '../systems/CombatSystem.js';
import SoundSystem from '../systems/SoundSystem.js';
import ParticleSystem from '../systems/ParticleSystem.js';
import HealthBar from '../ui/HealthBar.js';
import SoulGauge from '../ui/SoulGauge.js';
import BossHealthBar from '../ui/BossHealthBar.js';
import Boss from '../entities/Boss.js';
import SaveSystem from '../systems/SaveSystem.js';
import levelData from '../data/level1.json';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    // 是否从存档继续
    this.loadSave = data && data.loadSave;
    // 通关计时
    this.startTime = Date.now();
  }

  create() {
    const worldWidth = levelData.worldWidth;
    const worldHeight = levelData.worldHeight;

    // 1. 纹理
    this.generateTextures();

    // 2. 视差背景
    this.createBackground(worldWidth, worldHeight);

    // 3. 平台
    this.platforms = this.physics.add.staticGroup();
    this.createGround(worldWidth, worldHeight);
    this.createPlatforms();

    // 4. 玩家
    const spawn = levelData.playerSpawn;
    this.player = new Player(this, spawn.x, spawn.y);

    // 5. 敌人组
    this.enemies = this.physics.add.group();
    this.createEnemies();

    // 6. 陷阱组
    this.traps = this.physics.add.staticGroup();
    this.createTraps();

    // 7. 收集品组
    this.collectibles = this.physics.add.staticGroup();
    this.createCollectibles();

    // 8. 存档点组
    this.savePoints = this.physics.add.staticGroup();
    this.createSavePoints();

    // 9. Boss
    this.boss = null;
    this.bossHealthBar = null;
    if (levelData.boss) {
      this.boss = new Boss(this, levelData.boss.x, levelData.boss.y);
      this.enemies.add(this.boss);
      this.bossHealthBar = new BossHealthBar(this, this.boss.healthSystem.getMaxHealth());
      this.boss.bossHealthBar = this.bossHealthBar;
    }

    // 10. 弹幕组
    this.arrows = this.physics.add.group({ allowGravity: false });
    // 手里剑组
    this.shurikens = this.physics.add.group({ allowGravity: false });

    // 10. 碰撞
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.arrows, this.platforms, (arrow) => {
      arrow.destroy();
    });
    this.physics.add.collider(this.shurikens, this.platforms, (shuriken) => {
      shuriken.destroy();
    });

    // 手里剑命中敌人
    this.physics.add.overlap(this.shurikens, this.enemies, (shuriken, enemy) => {
      if (!shuriken.active || !enemy.active) return;
      enemy.takeDamage(2, this.player.x);
      if (this.particleSystem) this.particleSystem.emitSparks(shuriken.x, shuriken.y, 4);
      if (this.soundSystem) this.soundSystem.playHit();
      shuriken.destroy();
    });

    // 11. 陷阱 → 玩家
    this.physics.add.overlap(this.player, this.traps, this.onTouchTrap, null, this);

    // 12. 收集品 → 玩家
    this.physics.add.overlap(this.player, this.collectibles, this.onCollect, null, this);

    // 13. 存档点 → 玩家
    this.physics.add.overlap(this.player, this.savePoints, this.onTouchSavePoint, null, this);

    // 14. 世界边界
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // 15. 摄像机
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // 16. UI
    this.healthBar = new HealthBar(this, this.player.healthSystem.getMaxHealth());
    this.soulGauge = new SoulGauge(this);
    this.player.healthBar = this.healthBar;
    this.player.soulGauge = this.soulGauge;

    // 17. 音效和粒子系统
    this.soundSystem = new SoundSystem();
    this.particleSystem = new ParticleSystem(this);

    // 18. 战斗系统
    this.combatSystem = new CombatSystem(this);
    this.combatSystem.setup(this.player, this.enemies, this.soulGauge, this.soundSystem, this.particleSystem);
    this.combatSystem.setupArrows(this.arrows);

    // 把系统引用传给玩家
    this.player.soundSystem = this.soundSystem;
    this.player.particleSystem = this.particleSystem;

    // 读档（"继续"模式）
    if (this.loadSave && SaveSystem.exists()) {
      const save = SaveSystem.load();
      if (save && save.respawnPoint) {
        this.player.respawnPoint = save.respawnPoint;
        this.player.setPosition(save.respawnPoint.x, save.respawnPoint.y);
        this.player.healthSystem.currentHealth = save.health || this.player.healthSystem.getMaxHealth();
        this.player.soul = save.soul || 0;
        this.soulGauge.currentSoul = this.player.soul;
        if (this.healthBar) this.healthBar.update(save.health);
        if (this.soulGauge) this.soulGauge.drawFill(this.player.soul);
        console.log('存档已加载');
      }
    }

    // 18. 输入
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.dashKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.shurikenKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.healKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);

    // 入场淡入
    this.cameras.main.fadeIn(500);

    console.log('GameScene: 关卡「影之道」加载完毕');
  }

  // ===================== 纹理 =====================

  generateTextures() {
    // 玩家
    let gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(COLORS.PLAYER);
    gfx.fillRect(0, 0, 32, 48);
    gfx.fillStyle(0xcc3333);
    gfx.fillRect(6, 4, 20, 5);
    gfx.fillStyle(0x222222);
    gfx.fillRect(8, 14, 6, 4);
    gfx.fillRect(18, 14, 6, 4);
    gfx.generateTexture('player', 32, 48);
    gfx.destroy();

    // 平台
    gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(COLORS.PLATFORM);
    gfx.fillRect(0, 0, 64, 32);
    gfx.fillStyle(0x3a2718);
    gfx.fillRect(0, 0, 64, 5);
    gfx.generateTexture('platform', 64, 32);
    gfx.destroy();

    // 巡逻兵（绿）
    gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0x44aa44);
    gfx.fillRect(0, 0, 32, 32);
    gfx.fillStyle(0x228822);
    gfx.fillRect(4, 8, 24, 4);
    gfx.fillRect(4, 20, 24, 4);
    gfx.fillStyle(0xffff00);
    gfx.fillRect(6, 6, 6, 6);
    gfx.fillRect(20, 6, 6, 6);
    gfx.generateTexture('enemy_patrol', 32, 32);
    gfx.destroy();

    // 追踪兵（红）
    gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0xdd3333);
    gfx.fillRect(0, 0, 36, 36);
    gfx.fillStyle(0x991111);
    gfx.fillRect(4, 10, 28, 4);
    gfx.fillRect(4, 24, 28, 4);
    gfx.fillStyle(0xffaa00);
    gfx.fillRect(6, 6, 8, 8);
    gfx.fillRect(22, 6, 8, 8);
    gfx.generateTexture('enemy_chase', 36, 36);
    gfx.destroy();

    // 弓箭手（紫）
    gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0x9944cc);
    gfx.fillRect(0, 0, 32, 32);
    gfx.fillStyle(0x6622aa);
    gfx.fillRect(4, 8, 24, 4);
    gfx.fillRect(4, 20, 24, 4);
    gfx.fillStyle(0xff4444);
    gfx.fillRect(6, 6, 6, 6);
    gfx.fillRect(20, 6, 6, 6);
    gfx.generateTexture('enemy_archer', 32, 32);
    gfx.destroy();

    // 刀光
    gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0xffffff, 0.8);
    gfx.fillRect(0, 0, 48, 40);
    gfx.fillStyle(0xffffcc, 0.4);
    gfx.fillRect(12, 8, 24, 24);
    gfx.generateTexture('slash', 48, 40);
    gfx.destroy();

    // 弹幕
    gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0xffdd44);
    gfx.fillRect(0, 0, 16, 8);
    gfx.fillStyle(0xff6600);
    gfx.fillRect(10, 0, 6, 8);
    gfx.generateTexture('arrow', 16, 8);
    gfx.destroy();

    // 手里剑：旋转十字星
    gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0xcccccc);
    gfx.fillRect(4, 0, 8, 16);   // 竖
    gfx.fillRect(0, 4, 16, 8);   // 横
    gfx.fillStyle(0xffffff);
    gfx.fillRect(6, 2, 4, 12);
    gfx.fillRect(2, 6, 12, 4);
    gfx.generateTexture('shuriken', 16, 16);
    gfx.destroy();

    // 地刺陷阱（红色倒三角）
    gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(COLORS.TRAP);
    gfx.fillTriangle(16, 0, 0, 16, 32, 16);
    gfx.fillStyle(0xff6666);
    gfx.fillTriangle(16, 2, 6, 14, 26, 14);
    gfx.generateTexture('trap', 32, 16);
    gfx.destroy();

    // 收集品灵魂球
    gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(COLORS.COLLECTIBLE);
    gfx.fillCircle(6, 6, 6);
    gfx.fillStyle(0xffffff, 0.5);
    gfx.fillCircle(4, 4, 3);
    gfx.generateTexture('collectible', 12, 12);
    gfx.destroy();

    // 存档点神社标记
    gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(COLORS.SAVE_POINT);
    gfx.fillRect(8, 0, 8, 36);    // 柱
    gfx.fillRect(0, 0, 24, 4);    // 上横梁
    gfx.fillRect(2, 10, 20, 3);   // 下横梁
    gfx.fillStyle(0xffeebb, 0.6);
    gfx.fillRect(8, 0, 8, 36);
    gfx.generateTexture('save_point', 24, 40);
    gfx.destroy();

    // Boss 纹理：巨型暗红色
    gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0x991111);
    gfx.fillRect(0, 0, 64, 64);
    gfx.fillStyle(0x660000);
    gfx.fillRect(8, 16, 48, 8);
    gfx.fillRect(8, 40, 48, 8);
    gfx.fillStyle(0xff4400);
    gfx.fillRect(12, 6, 12, 12);
    gfx.fillRect(40, 6, 12, 12);
    gfx.generateTexture('boss', 64, 64);
    gfx.destroy();
  }

  // ===================== 视差背景 =====================

  createBackground(worldWidth, worldHeight) {
    // 远景：山脉剪影
    let gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0x1a1a3a);
    gfx.fillRect(0, 0, GAME_WIDTH, worldHeight);
    // 山脉形状
    gfx.fillStyle(0x151530);
    for (let i = 0; i < 12; i++) {
      const mx = i * 90 + Math.random() * 30;
      const mh = 80 + Math.random() * 120;
      gfx.fillTriangle(mx, worldHeight, mx + 45, worldHeight - mh, mx + 90, worldHeight);
    }
    gfx.generateTexture('bg_far', GAME_WIDTH, worldHeight);
    gfx.destroy();

    this.bgFar = this.add.tileSprite(0, 0, GAME_WIDTH, worldHeight, 'bg_far')
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-30);

    // 中景：松树林
    gfx = this.make.graphics({ x: 0, y: 0 });
    for (let i = 0; i < 15; i++) {
      const tx = i * 70 + Math.random() * 20;
      const th = 50 + Math.random() * 70;
      gfx.fillStyle(0x0d3320);
      gfx.fillTriangle(tx, worldHeight - 20, tx + 25, worldHeight - 20 - th, tx + 50, worldHeight - 20);
      gfx.fillStyle(0x0a2818);
      gfx.fillRect(tx + 20, worldHeight - 20 - th * 0.3, 10, th * 0.3);
    }
    gfx.generateTexture('bg_mid', GAME_WIDTH, worldHeight);
    gfx.destroy();

    this.bgMid = this.add.tileSprite(0, 0, GAME_WIDTH, worldHeight, 'bg_mid')
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-20);

    // 近景：灌木丛
    gfx = this.make.graphics({ x: 0, y: 0 });
    for (let i = 0; i < 20; i++) {
      const bx = i * 50 + Math.random() * 30;
      const bh = 20 + Math.random() * 40;
      gfx.fillStyle(0x1a3a18);
      gfx.fillEllipse(bx + 15, worldHeight - 10, 40, bh);
    }
    gfx.generateTexture('bg_near', GAME_WIDTH, worldHeight);
    gfx.destroy();

    this.bgNear = this.add.tileSprite(0, 0, GAME_WIDTH, worldHeight, 'bg_near')
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-10);
  }

  // ===================== 地面 =====================

  createGround(worldWidth, worldHeight) {
    const groundY = worldHeight - 32;
    for (let x = 64; x < worldWidth; x += 64) {
      this.platforms.create(x, groundY, 'platform');
    }
  }

  // ===================== 平台（从 JSON 加载） =====================

  createPlatforms() {
    levelData.platforms.forEach(p => {
      for (let i = 0; i < (p.tiles || 1); i++) {
        this.platforms.create(p.x + i * 64, p.y, 'platform');
      }
    });
  }

  // ===================== 敌人（从 JSON 加载） =====================

  createEnemies() {
    levelData.enemies.forEach(e => {
      let enemy;
      switch (e.type) {
        case 'patrol':
          enemy = new EnemyPatrol(this, e.x, e.y, e.patrolLeft, e.patrolRight);
          break;
        case 'chase':
          enemy = new EnemyChase(this, e.x, e.y, e.patrolLeft, e.patrolRight);
          break;
        case 'archer':
          enemy = new EnemyArcher(this, e.x, e.y);
          break;
      }
      if (enemy) this.enemies.add(enemy);
    });
  }

  // ===================== 陷阱 =====================

  createTraps() {
    levelData.traps.forEach(t => {
      const trap = new Trap(this, t.x, t.y, t.tiles || 1);
      this.traps.add(trap);
    });
  }

  onTouchTrap(player, trap) {
    if (player.invincible || player._isDead) return;
    player.takeDamage(TRAP.DAMAGE);
    player.setVelocityY(TRAP.KNOCKBACK_Y);
    if (this.soundSystem) this.soundSystem.playTrap();
    this.cameras.main.shake(120, 0.01);
  }

  // ===================== 收集品 =====================

  createCollectibles() {
    levelData.collectibles.forEach(c => {
      const item = new Collectible(this, c.x, c.y);
      this.collectibles.add(item);
    });
  }

  onCollect(player, item) {
    if (!item.active || item.collected) return;
    item.collect();
    if (this.soulGauge) {
      this.soulGauge.add(SOUL.COLLECTIBLE_AMOUNT);
    }
    console.log(`拾取灵魂球！+${SOUL.COLLECTIBLE_AMOUNT} 气`);
  }

  // ===================== 存档点 =====================

  createSavePoints() {
    levelData.savePoints.forEach(s => {
      const sp = new SavePoint(this, s.x, s.y);
      this.savePoints.add(sp);
    });
  }

  onTouchSavePoint(player, savePoint) {
    if (!savePoint.active) return;
    if (savePoint.activated) return;

    savePoint.activate();
    player.respawnPoint = { x: savePoint.x, y: savePoint.y - 24 };

    // 自动存档
    SaveSystem.save({
      health: player.healthSystem.getHealth(),
      soul: player.soul,
      respawnPoint: player.respawnPoint,
    });
  }

  // ===================== 弹幕（弓箭手调用） =====================

  createArrow(x, y, dir) {
    const arrow = this.physics.add.sprite(x, y, 'arrow');
    this.arrows.add(arrow);
    arrow.setVelocityX(ENEMY.PROJECTILE_SPEED * dir);
    arrow.setFlipX(dir === -1);

    this.time.delayedCall(3000, () => {
      if (arrow.active) arrow.destroy();
    });
  }

  createShuriken(x, y, dir) {
    const shuriken = this.physics.add.sprite(x, y, 'shuriken');
    this.shurikens.add(shuriken);
    shuriken.setVelocityX(400 * dir);
    // 旋转效果
    this.tweens.add({
      targets: shuriken,
      angle: shuriken.angle + 360 * dir,
      duration: 600,
      repeat: -1,
    });
    this.time.delayedCall(3000, () => {
      if (shuriken.active) shuriken.destroy();
    });
  }

  // ===================== Boss 召唤小兵 =====================

  spawnMinion(x, y) {
    const minion = new EnemyChase(this, x, y, x - 60, x + 60);
    this.enemies.add(minion);
    console.log('Boss 召唤小兵！');
  }

  // ===================== Boss 被击败 =====================

  onBossDefeated() {
    console.log('onBossDefeated 触发！');
    const clearTime = Date.now() - this.startTime;
    console.log('通关时间:', clearTime, 'ms');

    SaveSystem.delete();
    this.player.body.enable = false;

    // 延迟切换，确保死亡动画播完
    this.time.delayedCall(500, () => {
      console.log('尝试切换到 WinScene...');
      try {
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.time.delayedCall(800, () => {
          this.scene.start('Win', { clearTime });
        });
      } catch (e) {
        console.error('场景切换失败:', e);
      }
    });
  }

  // ===================== 主循环 =====================

  update(time, delta) {
    if (this.player._isDead) return;

    // 首次按键时初始化 AudioContext（浏览器策略）
    if (this.soundSystem && !this.soundSystem.ctx) {
      const keys = [this.cursors.left, this.cursors.right, this.cursors.up,
        this.wasd.left, this.wasd.right, this.wasd.up,
        this.jumpKey, this.dashKey, this.attackKey];
      if (keys.some(k => k.isDown)) {
        this.soundSystem.init();
      }
    }

    // 玩家
    const wasOnGround = this.player.body.blocked.down || this.player.body.touching.down;
    this.player.update(time, delta, this.cursors, this.wasd, this.jumpKey, this.dashKey);
    const isOnGround = this.player.body.blocked.down || this.player.body.touching.down;

    // 落地烟尘
    if (!wasOnGround && isOnGround && this.particleSystem) {
      this.particleSystem.emitLanding(this.player.x, this.player.y + 24);
    }

    // 敌人 AI
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.active && enemy.update) {
        enemy.update(time, delta, this.player);
      }
    });

    // Boss 血条：Boss 进入视野时显示
    if (this.boss && this.boss.active && this.bossHealthBar) {
      const inView = Math.abs(this.boss.x - this.player.x) < 500;
      if (inView && !this.bossHealthBar._visible) this.bossHealthBar.show();
      else if (!inView && this.bossHealthBar._visible) this.bossHealthBar.hide();
    }

    // 视差背景滚动
    const camX = this.cameras.main.scrollX;
    this.bgFar.tilePositionX = camX * 0.1;
    this.bgMid.tilePositionX = camX * 0.3;
    this.bgNear.tilePositionX = camX * 0.6;

    // 坠落死亡
    if (this.player.y > levelData.worldHeight + 80) {
      if (!this.player._isDead) {
        this.player.healthSystem.takeDamage(99);
        this.player.die();
      }
    }

    // 攻击
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.combatSystem.playerAttack();
    }
    // 手里剑
    if (Phaser.Input.Keyboard.JustDown(this.shurikenKey)) {
      this.player.fireShuriken();
    }
    // 聚气回血
    if (Phaser.Input.Keyboard.JustDown(this.healKey)) {
      this.player.heal();
    }

    // 战斗
    this.combatSystem.update(delta);
  }
}
