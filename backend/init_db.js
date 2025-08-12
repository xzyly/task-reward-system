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

  // 创建好友关系表
  db.exec(`
    CREATE TABLE IF NOT EXISTS friendship (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id),
      FOREIGN KEY (friend_id) REFERENCES user(id),
      UNIQUE(user_id, friend_id)
    )
  `);

  // 创建消息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS message (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES user(id),
      FOREIGN KEY (receiver_id) REFERENCES user(id)
    )
  `);

  console.log('数据库初始化完成');
} catch (err) {
  console.error('数据库初始化失败:', err);
} finally {
  db.close();
}