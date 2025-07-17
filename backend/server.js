const express = require('express');
const app = express();

app.use(express.json());

// 引入任务路由
const tasksRouter = require('./routes/tasks');
app.use('/api', tasksRouter);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});