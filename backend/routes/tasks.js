const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取所有任务列表
router.get('/tasks', (req, res) => {
  db.all('SELECT * FROM task', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 获取单个任务详情
router.get('/tasks/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM task WHERE id = ?', [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(row);
    });
});

router.post('/tasks/:id/accept', (req, res) => {
  const taskId = req.params.id;
  const takerId = req.body.taker_id; // 后续用 JWT 获取

  db.serialize(() => {
    db.get('SELECT * FROM task WHERE id = ?', [taskId], (err, task) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!task) return res.status(404).json({ error: 'Task not found' });
      if (task.status !== 'OPEN') return res.status(400).json({ error: 'Task already taken' });

      // 行级事务，防止并发抢单
      db.run('BEGIN TRANSACTION');
      db.run(
        'UPDATE task SET taker_id = ?, status = ? WHERE id = ? AND status = ?',
        [takerId, 'TAKEN', taskId, 'OPEN'],
        function (err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          if (this.changes === 0) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: 'Task already taken by others' });
          }
          db.run('COMMIT');
          res.json({ message: 'Task accepted successfully' });
        }
      );
    });
  });
});

router.post('/tasks/:id/finish', (req, res) => {
  const taskId = req.params.id;
  const takerId = req.body.taker_id; // 后续用 JWT 获取

  db.get('SELECT * FROM task WHERE id = ?', [taskId], (err, task) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'TAKEN') return res.status(400).json({ error: 'Task not in TAKEN status' });
    if (task.taker_id !== takerId) return res.status(403).json({ error: 'Only taker can finish the task' });

    db.run(
      'UPDATE task SET status = ? WHERE id = ?',
      ['COMPLETED', taskId],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Task finished successfully' });
      }
    );
  });
});

// 获取我接的任务
router.get('/tasks/my/:takerId', (req, res) => {
  const takerId = req.params.takerId;
  
  // 参数校验
  if (!takerId || isNaN(takerId)) {
    return res.status(400).json({ error: 'Invalid taker_id parameter' });
  }

  db.all(
    'SELECT * FROM task WHERE taker_id = ? ORDER BY created_at DESC', 
    [takerId], 
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        message: 'My tasks retrieved successfully',
        count: rows.length,
        tasks: rows
      });
    }
  );
});

// 发布新任务
router.post('/tasks', (req, res) => {
  const { title, description, reward, min_level, publisher_id } = req.body;

  // 参数校验
  if (!title || !description || !reward || !publisher_id) {
    return res.status(400).json({ 
      error: 'Missing required fields: title, description, reward, publisher_id' 
    });
  }

  if (isNaN(reward) || reward <= 0) {
    return res.status(400).json({ error: 'Reward must be a positive number' });
  }

  if (isNaN(publisher_id) || publisher_id <= 0) {
    return res.status(400).json({ error: 'Invalid publisher_id' });
  }

  // 设置默认值
  const minLevel = min_level || 1;

  db.run(
    `INSERT INTO task (title, description, reward, min_level, status, publisher_id) 
     VALUES (?, ?, ?, ?, 'OPEN', ?)`,
    [title, description, reward, minLevel, publisher_id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // 返回新创建的任务信息
      db.get('SELECT * FROM task WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
          message: 'Task created successfully',
          task: row
        });
      });
    }
  );
});

module.exports = router;