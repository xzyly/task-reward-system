const express = require('express');
const app = express();

app.use(express.json());

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

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

console.log(usersRouter.stack);
