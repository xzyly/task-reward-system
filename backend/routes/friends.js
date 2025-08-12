const express = require('express');
const db = require('../db');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * /api/friends/search:
 *   get:
 *     summary: 搜索用户
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: 要搜索的用户名
 *     responses:
 *       200:
 *         description: 搜索结果
 */
router.get('/friends/search', authenticate, (req, res) => {
    try {
        const { username } = req.query;
        const currentUserId = req.user.id;

        if (!username) {
            return res.status(400).json({ error: '请输入要搜索的用户名' });
        }

        // 搜索用户（排除自己）
        const users = db.prepare(`
            SELECT id, username, level, created_at 
            FROM user 
            WHERE username LIKE ? AND id != ?
            LIMIT 10
        `).all(`%${username}%`, currentUserId);

        // 查询与这些用户的好友关系状态
        const userIds = users.map(user => user.id);
        let friendshipStatuses = {};
        
        if (userIds.length > 0) {
            const placeholders = userIds.map(() => '?').join(',');
            const friendships = db.prepare(`
                SELECT friend_id, status 
                FROM friendship 
                WHERE user_id = ? AND friend_id IN (${placeholders})
            `).all(currentUserId, ...userIds);
            
            friendships.forEach(f => {
                friendshipStatuses[f.friend_id] = f.status;
            });
        }

        // 添加好友状态到结果中
        const result = users.map(user => ({
            ...user,
            friendshipStatus: friendshipStatuses[user.id] || 'none'
        }));

        res.json({ users: result });
    } catch (error) {
        console.error('搜索用户失败:', error);
        res.status(500).json({ error: '搜索用户失败' });
    }
});

/**
 * @swagger
 * /api/friends/request:
 *   post:
 *     summary: 发送好友申请
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: integer
 *                 description: 要添加的好友ID
 *     responses:
 *       201:
 *         description: 好友申请发送成功
 */
router.post('/friends/request', authenticate, (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.user.id;

        if (!friendId) {
            return res.status(400).json({ error: '请提供好友ID' });
        }

        if (friendId === userId) {
            return res.status(400).json({ error: '不能添加自己为好友' });
        }

        // 检查目标用户是否存在
        const targetUser = db.prepare('SELECT id FROM user WHERE id = ?').get(friendId);
        if (!targetUser) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 检查是否已经是好友或已发送申请
        const existingFriendship = db.prepare(`
            SELECT status FROM friendship 
            WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        `).get(userId, friendId, friendId, userId);

        if (existingFriendship) {
            if (existingFriendship.status === 'accepted') {
                return res.status(400).json({ error: '已经是好友了' });
            } else if (existingFriendship.status === 'pending') {
                return res.status(400).json({ error: '好友申请已发送，请等待对方回应' });
            }
        }

        // 创建好友申请
        db.prepare(`
            INSERT INTO friendship (user_id, friend_id, status)
            VALUES (?, ?, 'pending')
        `).run(userId, friendId);

        res.status(201).json({ message: '好友申请发送成功' });
    } catch (error) {
        console.error('发送好友申请失败:', error);
        res.status(500).json({ error: '发送好友申请失败' });
    }
});

/**
 * @swagger
 * /api/friends/requests:
 *   get:
 *     summary: 获取待处理的好友申请
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 好友申请列表
 */
router.get('/friends/requests', authenticate, (req, res) => {
    try {
        const userId = req.user.id;

        // 获取收到的好友申请
        const requests = db.prepare(`
            SELECT f.id, f.user_id, f.created_at, u.username, u.level
            FROM friendship f
            JOIN user u ON f.user_id = u.id
            WHERE f.friend_id = ? AND f.status = 'pending'
            ORDER BY f.created_at DESC
        `).all(userId);

        res.json({ requests });
    } catch (error) {
        console.error('获取好友申请失败:', error);
        res.status(500).json({ error: '获取好友申请失败' });
    }
});

/**
 * @swagger
 * /api/friends/respond:
 *   post:
 *     summary: 回应好友申请
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requestId:
 *                 type: integer
 *                 description: 好友申请ID
 *               action:
 *                 type: string
 *                 enum: [accept, reject]
 *                 description: 回应动作
 *     responses:
 *       200:
 *         description: 处理成功
 */
router.post('/friends/respond', authenticate, (req, res) => {
    try {
        const { requestId, action } = req.body;
        const userId = req.user.id;

        if (!requestId || !action) {
            return res.status(400).json({ error: '请提供申请ID和处理动作' });
        }

        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({ error: '无效的处理动作' });
        }

        // 检查申请是否存在且属于当前用户
        const request = db.prepare(`
            SELECT * FROM friendship 
            WHERE id = ? AND friend_id = ? AND status = 'pending'
        `).get(requestId, userId);

        if (!request) {
            return res.status(404).json({ error: '好友申请不存在或已处理' });
        }

        if (action === 'accept') {
            // 接受申请 - 更新状态并创建双向好友关系
            db.prepare(`
                UPDATE friendship 
                SET status = 'accepted', updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `).run(requestId);

            // 创建反向好友关系
            db.prepare(`
                INSERT INTO friendship (user_id, friend_id, status)
                VALUES (?, ?, 'accepted')
            `).run(userId, request.user_id);

            res.json({ message: '已接受好友申请' });
        } else {
            // 拒绝申请
            db.prepare(`
                UPDATE friendship 
                SET status = 'rejected', updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `).run(requestId);

            res.json({ message: '已拒绝好友申请' });
        }
    } catch (error) {
        console.error('处理好友申请失败:', error);
        res.status(500).json({ error: '处理好友申请失败' });
    }
});

/**
 * @swagger
 * /api/friends/list:
 *   get:
 *     summary: 获取好友列表
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 好友列表
 */
router.get('/friends/list', authenticate, (req, res) => {
    try {
        const userId = req.user.id;

        // 获取好友列表
        const friends = db.prepare(`
            SELECT u.id, u.username, u.level, f.created_at as friend_since
            FROM friendship f
            JOIN user u ON f.friend_id = u.id
            WHERE f.user_id = ? AND f.status = 'accepted'
            ORDER BY u.username
        `).all(userId);

        res.json({ friends });
    } catch (error) {
        console.error('获取好友列表失败:', error);
        res.status(500).json({ error: '获取好友列表失败' });
    }
});

/**
 * @swagger
 * /api/friends/remove:
 *   post:
 *     summary: 删除好友
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: integer
 *                 description: 要删除的好友ID
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.post('/friends/remove', authenticate, (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.user.id;

        if (!friendId) {
            return res.status(400).json({ error: '请提供好友ID' });
        }

        // 删除双向好友关系
        db.prepare(`
            DELETE FROM friendship 
            WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        `).run(userId, friendId, friendId, userId);

        res.json({ message: '好友删除成功' });
    } catch (error) {
        console.error('删除好友失败:', error);
        res.status(500).json({ error: '删除好友失败' });
    }
});

module.exports = router;
