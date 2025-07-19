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

//保护用户路由
app.use('/api',usersRouter);

//保护任务路由
app.use('/api',authenticate,tasksRouter)

// 默认路由，返回前端页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'taskList.html'));
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
<<<<<<< HEAD
});
 
=======
  console.log('API available at http://localhost:3000/api');
});
>>>>>>> origin/main
