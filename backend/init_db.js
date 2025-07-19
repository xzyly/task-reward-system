const db = require('./db');

try {
  // 创建用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建任务表
  db.exec(`
    CREATE TABLE IF NOT EXISTS task (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      reward INTEGER NOT NULL,
      min_level INTEGER DEFAULT 1,
      status TEXT DEFAULT 'OPEN',
      publisher_id INTEGER NOT NULL,
      taker_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (publisher_id) REFERENCES user(id),
      FOREIGN KEY (taker_id) REFERENCES user(id)
    )
  `);

  console.log('数据库初始化完成');
} catch (err) {
  console.error('数据库初始化失败:', err);
} finally {
  db.close();
}