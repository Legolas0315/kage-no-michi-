// 通用生命值管理 — 玩家和敌人都能使用
export default class HealthSystem {
  constructor(maxHealth) {
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
  }

  // 扣血，返回是否死亡
  takeDamage(amount) {
    this.currentHealth -= amount;
    if (this.currentHealth < 0) {
      this.currentHealth = 0;
    }
    return this.isDead();
  }

  // 回血
  heal(amount) {
    this.currentHealth += amount;
    if (this.currentHealth > this.maxHealth) {
      this.currentHealth = this.maxHealth;
    }
  }

  // 当前血量
  getHealth() {
    return this.currentHealth;
  }

  // 最大血量
  getMaxHealth() {
    return this.maxHealth;
  }

  // 血量百分比 (0~1)
  getHealthPercent() {
    return this.currentHealth / this.maxHealth;
  }

  // 是否死亡
  isDead() {
    return this.currentHealth <= 0;
  }
}
