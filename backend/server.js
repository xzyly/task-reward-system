const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const app = express();
const server = createServer(app);

// 启用CORS
app.use(cors());

// 解析JSON请求体
app.use(express.json());

// 提供静态文件服务（前端文件）
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// 引入任务路由
const tasksRouter = require('./routes/tasks');
const usersRouter = require('./routes/user');
const friendsRouter = require('./routes/friends');
const messagesRouter = require('./routes/messages');
const { authenticate } = require('./middlewares/auth');
const setupSwagger = require('./swagger');

setupSwagger(app);

// 用户路由（注册和登录不需要认证）
app.use('/api', usersRouter);

// 任务路由（部分路由需要认证，部分公开）
app.use('/api', tasksRouter);

// 好友路由（需要认证）
app.use('/api', friendsRouter);

// 消息路由（需要认证）
app.use('/api', messagesRouter);

// 初始化Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// WebSocket连接管理
const connectedUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);

    // 用户身份验证和注册
    socket.on('authenticate', (data) => {
        const { userId, token } = data;
        // 这里可以验证token的有效性
        if (userId) {
            connectedUsers.set(userId, socket.id);
            socket.userId = userId;
            console.log(`用户 ${userId} 已连接, socket: ${socket.id}`);
        }
    });

    // 加入房间（用于好友间私聊）
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} 加入房间 ${roomId}`);
    });

    // 发送消息
    socket.on('send-message', (data) => {
        const { receiverId, content, messageData } = data;
        
        // 创建房间ID（确保双方使用相同的房间ID）
        const roomId = [socket.userId, receiverId].sort().join('-');
        
        // 向房间内所有用户发送消息
        io.to(roomId).emit('receive-message', {
            ...messageData,
            roomId
        });

        console.log(`消息发送: ${socket.userId} -> ${receiverId} 在房间 ${roomId}`);
    });

    // 用户断开连接
    socket.on('disconnect', () => {
        if (socket.userId) {
            connectedUsers.delete(socket.userId);
            console.log(`用户 ${socket.userId} 断开连接`);
        }
        console.log('用户断开连接:', socket.id);
    });
});

// 导出io实例供其他模块使用
app.locals.io = io;

// 默认路由，返回首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// 导出app以便测试使用
module.exports = app;

// 只有在直接运行此文件时才启动服务器
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  
  server.listen(PORT, () => {
    console.log(`🚀 服务器成功启动！`);
    console.log(`🌐 网站地址: http://localhost:${PORT}`);
    console.log(`📚 API文档: http://localhost:${PORT}/api-docs`);
    console.log(`📋 任务列表: http://localhost:${PORT}/taskList.html`);
    console.log(`🔐 登录注册: http://localhost:${PORT}/auth.html`);
    console.log('');
    console.log('按 Ctrl+C 停止服务器');
  });

  // 错误处理
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`❌ 端口 ${PORT} 已被占用！`);
      console.log('');
      console.log('解决方案：');
      console.log(`1. 终止占用进程: taskkill /PID $(netstat -ano | findstr :${PORT} | awk '{print $5}') /F`);
      console.log(`2. 使用其他端口: set PORT=3001 && node server.js`);
      console.log('3. 检查是否已有服务器在运行');
      process.exit(1);
    } else {
      console.error('❌ 服务器启动失败:', err.message);
      process.exit(1);
    }
  });

  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务器...');
    server.close(() => {
      console.log('✅ 服务器已安全关闭');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 收到终止信号，正在关闭服务器...');
    server.close(() => {
      console.log('✅ 服务器已安全关闭');
      process.exit(0);
    });
  });
}
