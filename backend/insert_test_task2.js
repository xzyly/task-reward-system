const db = require('./db');

db.run(
  `INSERT INTO task (title, description, reward, min_level, status, publisher_id) VALUES (?, ?, ?, ?, ?, ?)`,
  ['第二个测试任务', '这是第二个测试任务', 200, 1, 'OPEN', 1],
  function (err) {
    if (err) {
      return console.error(err.message);
    }
    console.log('插入成功，任务ID:', this.lastID);
    db.close();
  }
); 