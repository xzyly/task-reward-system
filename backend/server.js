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

// 默认路由，返回首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// 导出app以便测试使用
module.exports = app;

// 只有在直接运行此文件时才启动服务器
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  
  const server = app.listen(PORT, () => {
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
