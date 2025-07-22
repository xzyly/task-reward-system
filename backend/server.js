const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// 启用CORS
app.use(cors());

// 解析JSON请求体
app.use(express.json());

// 提供静态文件服务（前端文件）
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// 引入任务路由
const tasksRouter = require('./routes/tasks');
const usersRouter = require('./routes/user');
const { authenticate } = require('./middlewares/auth');
const setupSwagger = require('./swagger');

setupSwagger(app);

// 用户路由（注册和登录不需要认证）
app.use('/api', usersRouter);

// 任务路由（部分路由需要认证，部分公开）
app.use('/api', tasksRouter);

// 默认路由，返回前端页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'taskList.html'));
});

// 需要认证的路由
app.post('/api/protected-route', authenticate, (req, res) => {
    // 可以通过req.userId获取当前用户ID
    res.json({ message: '认证成功', userId: req.userId });
});



// 导出app以便测试使用
module.exports = app;

// 只有在直接运行此文件时才启动服务器
if (require.main === module) {
  app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
    console.log('API available at http://localhost:3000/api');
  });
}
