const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * tags:
 *   - name: 用户
 *     description: 用户注册和登录管理
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 用户ID
 *         username:
 *           type: string
 *           description: 用户名
 *         level:
 *           type: integer
 *           description: 用户等级
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *     AuthToken:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT认证令牌
 *         userId:
 *           type: integer
 *           description: 用户ID
 *         username:
 *           type: string
 *           description: 用户名
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: 用户注册
 *     tags: [用户]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "user123"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: 用户名已存在或输入无效
 *       500:
 *         description: 服务器错误
 */

// 用户注册
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 验证输入
        if (!username || !password) {
            return res.status(400).json({
                error: '用户名和密码不能为空'
            });
        }

        // 检查用户名是否已存在
        const existingUser = db.prepare('SELECT id FROM user WHERE username = ?').get(username);
        if (existingUser) {
            return res.status(400).json({
                error: '用户名已存在'
            });
        }

        // 哈希密码
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 创建用户
        const result = db.prepare(
            'INSERT INTO user (username, password_hash) VALUES (?, ?)'
        ).run(username, passwordHash);

        res.status(201).json({ id: result.lastInsertRowid, username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: 用户登录
 *     tags: [用户]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "user123"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthToken'
 *       401:
 *         description: 用户名或密码错误
 *       500:
 *         description: 服务器错误
 */

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 查找用户 
        const user = db.prepare('SELECT * FROM user WHERE username = ?').get(username);

        if (!user) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 验证密码
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 生成JWT令牌
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({ token, userId: user.id, username: user.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;





 























