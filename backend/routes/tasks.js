const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *  name: 任务
 *  description: 任务管理
 */

/**
 * @swagger
 * components:
 *  schemas:
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 任务ID
 *         title:
 *           type: string
 *           description: 任务标题
 *         description:
 *           type: string
 *           description: 任务描述
 *         reward:
 *           type: integer
 *           description: 悬赏金额
 *         status:
 *           type: string
 *           enum: [OPEN, TAKEN, COMPLETED]
 *           description: 任务状态
 *         publisher_id:
 *           type: integer
 *           description: 发布者ID
 *         taker_id:
 *           type: integer
 *           description: 接单者ID
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 */

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: 获取所有任务列表
 *     tags: [任务]
 *     security: []
 *     responses:
 *       200:
 *         description: 任务列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       500:
 *         description: 服务器错误
 */


// 获取所有任务列表
router.get('/tasks', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM task').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: 获取单个任务详情
 *     tags: [任务]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 任务ID
 *     responses:
 *       200:
 *         description: 任务详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: 任务未找到
 *       500:
 *         description: 服务器错误
 */

// 获取单个任务详情
router.get('/tasks/:id', (req, res) => {
  try {
    const id = req.params.id;
    const row = db.prepare('SELECT * FROM task WHERE id = ?').get(id);
    if (!row) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /tasks/{id}/accept:
 *   post:
 *     summary: 接受任务
 *     tags: [任务]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 任务ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AcceptTask'
 *     responses:
 *       200:
 *         description: 接单成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 任务已被接或状态无效
 *       404:
 *         description: 任务未找到
 *       500:
 *         description: 服务器错误
 */

router.post('/tasks/:id/accept', (req, res) => {
  const taskId = req.params.id;
  const takerId = req.body.taker_id || req.userId; // 临时兼容，优先从JWT获取

  try {
    // 开始事务
    const transaction = db.transaction(() => {
      const task = db.prepare('SELECT * FROM task WHERE id = ?').get(taskId);
      if (!task) {
        throw new Error('Task not found');
      }
      if (task.status !== 'OPEN') {
        throw new Error('Task already taken');
      }

      // 更新任务状态，防止并发抢单
      const updateResult = db.prepare(
        'UPDATE task SET taker_id = ?, status = ? WHERE id = ? AND status = ?'
      ).run(takerId, 'TAKEN', taskId, 'OPEN');

      if (updateResult.changes === 0) {
        throw new Error('Task already taken by others');
      }
      
      return { message: 'Task accepted successfully' };
    });

    const result = transaction();
    res.json(result);
  } catch (err) {
    if (err.message === 'Task not found') {
      res.status(404).json({ error: err.message });
    } else if (err.message.includes('already taken')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

/**
 * @swagger
 * /tasks/{id}/finish:
 *   post:
 *     summary: 完成任务
 *     tags: [任务]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 任务ID
 *     responses:
 *       200:
 *         description: 任务完成
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 任务状态无效
 *       403:
 *         description: 只有接单者可以完成任务
 *       404:
 *         description: 任务未找到
 *       500:
 *         description: 服务器错误
 */

router.post('/tasks/:id/finish', authenticate, (req, res) => {
  const taskId = req.params.id;
  const takerId = req.userId; // 从JWT获取

  try {
    const task = db.prepare('SELECT * FROM task WHERE id = ?').get(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    if (task.status !== 'TAKEN') {
      return res.status(400).json({ error: 'Task not in TAKEN status' });
    }
    if (task.taker_id !== takerId) {
      return res.status(403).json({ error: 'Only taker can finish the task' });
    }

    db.prepare('UPDATE task SET status = ? WHERE id = ?').run('COMPLETED', taskId);
    res.json({ message: 'Task finished successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /tasks/my-tasks:
 *   get:
 *     summary: 获取当前用户接取的任务
 *     tags: [任务]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取任务列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         description: 未认证
 *       500:
 *         description: 服务器错误
 */

// 获取我接的任务
router.get('/tasks/my/:takerId', authenticate, (req, res) => {
  const takerId = req.params.takerId;
  
  // 参数校验
  if (!takerId || isNaN(takerId)) {
    return res.status(400).json({ error: 'Invalid taker_id parameter' });
  }

  try {
    const rows = db.prepare(
      'SELECT * FROM task WHERE taker_id = ? ORDER BY created_at DESC'
    ).all(takerId);
    
    res.json({
      message: 'My tasks retrieved successfully',
      count: rows.length,
      tasks: rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: 发布新任务
 *     tags: [任务]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - reward
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               reward:
 *                 type: integer
 *               min_level:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       201:
 *         description: 任务创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未认证
 *       500:
 *         description: 服务器错误
 */

// 发布新任务
router.post('/tasks', authenticate, (req, res) => {
  const { title, description, reward, min_level } = req.body;
  const publisher_id = req.userId; // 从JWT获取发布者ID

  // 参数校验
  if (!title || !description || !reward) {
    return res.status(400).json({ 
      error: 'Missing required fields: title, description, reward' 
    });
  }

  if (isNaN(reward) || reward <= 0) {
    return res.status(400).json({ error: 'Reward must be a positive number' });
  }

  // 设置默认值
  const minLevel = min_level || 1;

  try {
    const insertResult = db.prepare(
      `INSERT INTO task (title, description, reward, min_level, status, publisher_id) 
       VALUES (?, ?, ?, ?, 'OPEN', ?)`
    ).run(title, description, reward, minLevel, publisher_id);
    
    // 返回新创建的任务信息
    const newTask = db.prepare('SELECT * FROM task WHERE id = ?').get(insertResult.lastInsertRowid);
    
    res.status(201).json({
      message: 'Task created successfully',
      task: newTask
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;







