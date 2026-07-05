// localStorage 存档系统
const SAVE_KEY = 'kage_no_michi_save';

export default class SaveSystem {
  // 保存存档
  static save(data) {
    try {
      const saveData = {
        ...data,
        timestamp: Date.now(),
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      console.log('存档已保存');
      return true;
    } catch (e) {
      console.warn('存档失败:', e);
      return false;
    }
  }

  // 读取存档
  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('读档失败:', e);
      return null;
    }
  }

  // 是否有存档
  static exists() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  // 删除存档
  static delete() {
    localStorage.removeItem(SAVE_KEY);
    console.log('存档已清除');
  }
}
