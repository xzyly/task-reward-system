const express = require('express');
const db = require('../db');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * /api/messages/send:
 *   post:
 *     summary: 发送消息
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiverId:
 *                 type: integer
 *                 description: 接收者ID
 *               content:
 *                 type: string
 *                 description: 消息内容
 *     responses:
 *       201:
 *         description: 消息发送成功
 */
router.post('/messages/send', authenticate, (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user.id;

        if (!receiverId || !content) {
            return res.status(400).json({ error: '请提供接收者ID和消息内容' });
        }

        if (receiverId === senderId) {
            return res.status(400).json({ error: '不能给自己发送消息' });
        }

        // 检查是否为好友关系
        const friendship = db.prepare(`
            SELECT id FROM friendship 
            WHERE user_id = ? AND friend_id = ? AND status = 'accepted'
        `).get(senderId, receiverId);

        if (!friendship) {
            return res.status(403).json({ error: '只能向好友发送消息' });
        }

        // 发送消息
        const result = db.prepare(`
            INSERT INTO message (sender_id, receiver_id, content)
            VALUES (?, ?, ?)
        `).run(senderId, receiverId, content);

        // 获取刚插入的消息
        const message = db.prepare(`
            SELECT m.*, u.username as sender_username
            FROM message m
            JOIN user u ON m.sender_id = u.id
            WHERE m.id = ?
        `).get(result.lastInsertRowid);

        // 通过WebSocket实时发送消息
        if (req.app.locals.io) {
            const roomId = [senderId, receiverId].sort().join('-');
            req.app.locals.io.to(roomId).emit('receive-message', message);
        }

        res.status(201).json({ 
            message: '消息发送成功',
            messageData: message
        });
    } catch (error) {
        console.error('发送消息失败:', error);
        res.status(500).json({ error: '发送消息失败' });
    }
});

/**
 * @swagger
 * /api/messages/history:
 *   get:
 *     summary: 获取聊天记录
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: friendId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 好友ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 每页消息数量
 *     responses:
 *       200:
 *         description: 聊天记录
 */
router.get('/messages/history', authenticate, (req, res) => {
    try {
        const { friendId, page = 1, limit = 50 } = req.query;
        const userId = req.user.id;

        if (!friendId) {
            return res.status(400).json({ error: '请提供好友ID' });
        }

        // 检查是否为好友关系
        const friendship = db.prepare(`
            SELECT id FROM friendship 
            WHERE user_id = ? AND friend_id = ? AND status = 'accepted'
        `).get(userId, parseInt(friendId));

        if (!friendship) {
            return res.status(403).json({ error: '只能查看与好友的聊天记录' });
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // 获取聊天记录
        const messages = db.prepare(`
            SELECT m.*, 
                   s.username as sender_username,
                   r.username as receiver_username
            FROM message m
            JOIN user s ON m.sender_id = s.id
            JOIN user r ON m.receiver_id = r.id
            WHERE (m.sender_id = ? AND m.receiver_id = ?) 
               OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.created_at DESC
            LIMIT ? OFFSET ?
        `).all(userId, parseInt(friendId), parseInt(friendId), userId, parseInt(limit), offset);

        // 获取总数
        const totalCount = db.prepare(`
            SELECT COUNT(*) as count
            FROM message 
            WHERE (sender_id = ? AND receiver_id = ?) 
               OR (sender_id = ? AND receiver_id = ?)
        `).get(userId, parseInt(friendId), parseInt(friendId), userId);

        // 标记消息为已读（将对方发给我的消息标记为已读）
        db.prepare(`
            UPDATE message 
            SET is_read = 1 
            WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
        `).run(parseInt(friendId), userId);

        res.json({ 
            messages: messages.reverse(), // 反转顺序，让最新消息在最后
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount.count,
                totalPages: Math.ceil(totalCount.count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('获取聊天记录失败:', error);
        res.status(500).json({ error: '获取聊天记录失败' });
    }
});

/**
 * @swagger
 * /api/messages/unread:
 *   get:
 *     summary: 获取未读消息统计
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 未读消息统计
 */
router.get('/messages/unread', authenticate, (req, res) => {
    try {
        const userId = req.user.id;

        // 按发送者统计未读消息
        const unreadStats = db.prepare(`
            SELECT m.sender_id, u.username, COUNT(*) as unread_count
            FROM message m
            JOIN user u ON m.sender_id = u.id
            WHERE m.receiver_id = ? AND m.is_read = 0
            GROUP BY m.sender_id, u.username
            ORDER BY MAX(m.created_at) DESC
        `).all(userId);

        // 总未读消息数
        const totalUnread = db.prepare(`
            SELECT COUNT(*) as count
            FROM message 
            WHERE receiver_id = ? AND is_read = 0
        `).get(userId);

        res.json({ 
            unreadStats,
            totalUnread: totalUnread.count
        });
    } catch (error) {
        console.error('获取未读消息统计失败:', error);
        res.status(500).json({ error: '获取未读消息统计失败' });
    }
});

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     summary: 获取会话列表
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 会话列表
 */
router.get('/messages/conversations', authenticate, (req, res) => {
    try {
        const userId = req.user.id;

        // 获取会话列表（最近聊天的好友）
        const conversations = db.prepare(`
            SELECT 
                CASE 
                    WHEN m.sender_id = ? THEN m.receiver_id 
                    ELSE m.sender_id 
                END as friend_id,
                u.username as friend_username,
                u.level as friend_level,
                m.content as last_message,
                m.created_at as last_message_time,
                m.sender_id = ? as is_sent_by_me,
                COALESCE(unread.unread_count, 0) as unread_count
            FROM message m
            JOIN user u ON (
                CASE 
                    WHEN m.sender_id = ? THEN m.receiver_id 
                    ELSE m.sender_id 
                END = u.id
            )
            LEFT JOIN (
                SELECT sender_id, COUNT(*) as unread_count
                FROM message 
                WHERE receiver_id = ? AND is_read = 0
                GROUP BY sender_id
            ) unread ON unread.sender_id = (
                CASE 
                    WHEN m.sender_id = ? THEN m.receiver_id 
                    ELSE m.sender_id 
                END
            )
            WHERE m.id IN (
                SELECT MAX(id)
                FROM message 
                WHERE sender_id = ? OR receiver_id = ?
                GROUP BY 
                    CASE 
                        WHEN sender_id = ? THEN receiver_id 
                        ELSE sender_id 
                    END
            )
            AND EXISTS (
                SELECT 1 FROM friendship f
                WHERE f.user_id = ? AND f.friend_id = (
                    CASE 
                        WHEN m.sender_id = ? THEN m.receiver_id 
                        ELSE m.sender_id 
                    END
                ) AND f.status = 'accepted'
            )
            ORDER BY m.created_at DESC
        `).all(userId, userId, userId, userId, userId, userId, userId, userId, userId, userId);

        res.json({ conversations });
    } catch (error) {
        console.error('获取会话列表失败:', error);
        res.status(500).json({ error: '获取会话列表失败' });
    }
});

module.exports = router;
