# 影之道 (Kage no Michi) — 忍者横版动作游戏

## 项目概述

一款忍者主题的横版动作小游戏，参考《空洞骑士》的战斗手感设计。玩家扮演流亡忍者"影"，穿越被黑暗势力侵蚀的古代日本，用武士刀与手里剑击败敌人。

- **类型**：横版动作 / 平台跳跃
- **技术栈**：Phaser 4 + Vite + JavaScript
- **平台**：浏览器（HTML5）
- **开发者**：编程初学者，边学边做

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Phaser | ^4.2.0 | 2D 游戏框架（物理、动画、音效、场景） |
| Vite | ^8.1.3 | 开发服务器 + 构建工具 |
| JavaScript | ES Module | 全部游戏逻辑 |

## 项目结构

```
game/
├── index.html              # 浏览器入口页面
├── package.json            # 项目依赖配置
├── vite.config.js          # Vite 构建配置
├── CLAUDE.md               # 本文件 — 项目文档
├── public/assets/          # 静态资源
│   ├── images/player/      # 玩家精灵图
│   ├── images/enemies/     # 敌人精灵图
│   ├── images/tiles/       # 关卡瓦片
│   ├── images/background/  # 背景图层
│   ├── audio/sfx/          # 音效
│   ├── audio/music/        # 背景音乐
│   └── data/               # 关卡地图数据 (JSON)
└── src/
    ├── main.js             # 浏览器入口
    └── game/
        ├── main.js         # Phaser 配置和启动
        ├── config.js       # 游戏参数常量
        ├── scenes/         # 场景
        │   ├── BootScene.js     # 标题画面
        │   ├── MenuScene.js     # 主菜单
        │   ├── GameScene.js     # 核心游戏场景
        │   ├── WinScene.js      # 胜利画面
        ├── entities/       # 游戏实体
        │   ├── Player.js        # 玩家（移动/攻击/冲刺）
        │   ├── EnemyBase.js     # 敌人基类（状态机）
        │   ├── EnemyPatrol.js   # 巡逻兵
        │   ├── EnemyChase.js    # 追踪兵
        │   ├── EnemyArcher.js   # 弓箭手
        │   ├── Boss.js          # Boss（三阶段）
        │   ├── Trap.js          # 地刺陷阱
        │   ├── Collectible.js   # 灵魂球收集品
        │   └── SavePoint.js     # 神社存档点
        ├── systems/        # 游戏系统
        │   ├── CombatSystem.js  # 战斗判定
        │   ├── HealthSystem.js  # 生命管理
        │   ├── SoundSystem.js   # Web Audio 音效
        │   ├── ParticleSystem.js# 粒子特效
        │   └── SaveSystem.js    # localStorage 存档
        ├── ui/             # UI 组件
        │   ├── HealthBar.js     # 面具血条
        │   ├── SoulGauge.js     # 气槽
        │   └── BossHealthBar.js # Boss 血条
        ├── data/           # 关卡数据
        │   └── level1.json     # 第一关配置
        └── utils/          # 工具函数
```

---

## 开发计划（7 个阶段）

### 阶段 1：Hello Phaser ✅
- [x] 创建 Phaser + Vite 项目
- [x] 理解场景生命周期 (preload/create/update)
- [x] 显示标题画面 "影之道"

### 阶段 2：忍者跑起来 ✅
- [x] 创建 Player 实体（占位图形）
- [x] 左右移动（A/D 或方向键）
- [x] 跳跃（空格，可变高度）
- [x] 冲刺（Shift，短暂无敌）
- [x] 平台碰撞（静态物理体）
- [x] 摄像机跟随玩家

#### 🐛 踩坑记录

| 问题 | 原因 | 修复 |
|------|------|------|
| W 和 ↑ 不能跳跃 | `handleJump()` 只接收了空格键，W/↑ 虽然绑定了但没传入跳跃检测 | 改 `handleJump(cursors, wasd, jumpKey)`，三个键任一按下都能跳 |

---

### 阶段 3：刀光剑影 ✅
- [x] 攻击动画（J 键挥刀）
- [x] 攻击判定框
- [x] 碰撞检测（攻击命中敌人）
- [x] 血条系统（面具血条）
- [x] 受伤无敌帧
- [x] "气"槽（攻击命中积累）

#### 🐛 踩坑记录

| 问题 | 原因 | 修复 |
|------|------|------|
| 气槽砍一刀就几乎满了 | 判定框(200ms) > 敌人受伤无敌(100ms)，同一刀命中同一敌人两次；且一刀可命中范围内所有敌人 | `Set` 记录已命中敌人防止重复；`PER_HIT` 从 15 降到 12 |
| 气槽看不到上限 | 边框太暗，未填充区域和背景融为一体 | 加亮色上限框 + 25%/50%/75%/100% 刻度线 + 满气闪烁 |
| 3 条命耗尽后画面定格 | `GameScene.update()` 检测死亡后 `return`，导致 `Player.update()` 不执行，`die()` 永不调用 | `takeDamage()` 中血归零立即调用 `die()` |
| 死亡后人物倒退飘走 | knockback 速度未被清零 + `die()` 未被调用 | `die()` 中 `setVelocity(0,0)` + `body.enable = false` |
| 死亡后不返回菜单 | 动画结束没跳转 | 死亡动画 → "影消散于黑暗…" → 2 秒后跳转 Menu |

---

### 阶段 4：敌影重重 ✅
- [x] EnemyBase 基类
- [x] 巡逻兵 AI（固定范围巡逻）
- [x] 追踪兵 AI（发现玩家后追击）
- [x] 弓箭手 AI（远程射击）
- [x] 状态机模式

#### 🐛 踩坑记录

| 问题 | 原因 | 修复 |
|------|------|------|
| 弓箭手（紫色）追踪玩家 | 继承了基类 `executeState()`，ATTACK 状态调 `executeAttack()` 会冲锋 | 弓箭手重写 `executeState`，IDLE/ATTACK 原地不动 |
| 箭矢掉在地上 | `arrows.add(arrow)` 时物理组默认 `allowGravity: true` 覆盖了单独设置 | 创建组时 `{ allowGravity: false }` |
| 箭矢悬停不飞 | 同上，组 `add()` 也重置了 velocity | 先 `add()` 再 `setVelocityX()` |
| 追踪兵 3 HP 太难 | 设计值偏高 | 降为 2 HP，和其他敌人统一 |

---

### 阶段 5：关卡世界 ✅
- [x] 视差滚动背景（3 层：远山/松林/灌木）
- [x] JSON 关卡数据驱动
- [x] 陷阱（地刺，碰到扣血+弹飞）
- [x] 收集品（灵魂球，拾取加气）
- [x] 存档点（神社，触碰后死亡可复活）

#### 🐛 踩坑记录

| 问题 | 原因 | 修复 |
|------|------|------|
| JSON 导入报错 | Vite 不能从 `public/` 目录 `import` JSON 文件——public 下的文件原样复制不处理，只有 `src/` 下的文件才经过 Vite 打包管线 | JSON 移到 `src/game/data/`，用相对路径 `import` |
| 地刺踩不到 | 陷阱 y=508 和地面同一高度，被埋在地面贴图内部 | 陷阱 y 改为 488（地面表面），碰撞体从 12px 加高到 14px |

---

### 阶段 6：视听盛宴 ✅
- [x] 音效系统（Web Audio API 合成 9 种音效）
- [x] 粒子特效（命中火花/死亡爆炸/落地烟尘/收集闪光）
- [x] 屏幕震动（受击/重击/敌人死亡）
- [x] Hit stop 停顿帧（命中瞬间暂停 40ms）

#### 🐛 踩坑记录

> 本阶段无重大 bug。需要留意浏览器自动播放策略——AudioContext 必须在用户首次按键后才能创建，否则音效无声。

---

### 阶段 7：完整游戏 ✅
- [x] 完整主菜单（标题动画 + ↑↓ 选择新游戏/继续）
- [x] Boss 战（3 阶段 AI：冲刺→跳砸+震荡波→狂暴+召唤小兵）
- [x] 胜利画面（WinScene + 通关计时）
- [x] 存档系统（localStorage 神社自动存档）
- [x] 场景切换过渡（淡入淡出）
- [x] K 键手里剑（远程攻击，消耗 25 气，伤害 2 点）
- [x] 游戏打包（`npm run build` → `dist/`）

#### 🐛 踩坑记录

| 问题 | 原因 | 修复 |
|------|------|------|
| 气槽满了按 K 还是"气不足" | `SoulGauge.currentSoul` 和 `Player.soul` 是两个独立变量，气槽涨了但 Player 不知道 | `fireShuriken()` 直接读 `soulGauge.currentSoul` |
| Boss 击杀后血条还有残血 | `die()` 后状态变 DEAD，`updateAI()` 不执行，血条最后一次更新停在死亡前 | `die()` 中手动 `bossHealthBar.update(0)` |
| Boss 击杀后游戏定格 | `die()` 中 `this.scene` 引用的 Boss 在 300ms 后被 `destroy()`，闭包中的 `this` 失效 | 提前用局部变量 `const scene = this.scene` 捕获引用 |

---

## 核心配置

```js
// 玩家参数（可在 config.js 中调整）
PLAYER: {
  SPEED: 200,
  JUMP_FORCE: -450,
  MAX_HEALTH: 3,
  ATTACK_DAMAGE: 1,
  DASH_SPEED: 400,
  DASH_DURATION: 200,
  DASH_COOLDOWN: 800,
  INVINCIBLE_DURATION: 1000,
}

// 游戏画面
GAME_WIDTH: 960
GAME_HEIGHT: 540
```

---

## 玩家操作

| 按键 | 动作 |
|------|------|
| A / D 或 ← → | 左右移动 |
| 空格 / W / ↑ | 跳跃（短按小跳，长按大跳） |
| Shift | 冲刺（无敌帧） |
| J | 武士刀攻击 |
| K | 手里剑（消耗 25 气，2 点伤害） |

---

## 启动方式

```bash
cd "c:/aicoding/game"
npm install
npm run dev
# 浏览器打开 http://localhost:3000
```

## 打包部署

```bash
npm run build   # 输出到 dist/，可直接部署到静态服务器
```

## 注意事项

- 当前阶段使用**彩色方块**做占位图形，美术素材后续替换
- 每完成一个功能就用 `git commit` 保存
- 遇到问题直接问 Claude Code
- `console.log()` 是调试的好帮手
- 物理组 `add()` 会重置 gravity 和 velocity，设置速度/重力请在 `add()` 之后
- Vite 中 `import` JSON 需要放在 `src/` 目录，`public/` 的文件只能通过 URL 访问
- 闭包引用 Phaser 对象时，注意对象可能被 `destroy()`，提前用局部变量捕获
