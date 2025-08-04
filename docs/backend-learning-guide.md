# 后端开发学习指南

## 学习路径图

```
1. 基础概念理解
   ↓
2. 数据库设计与连接 (db.js, init_db.js)
   ↓  
3. 服务器启动 (server.js)
   ↓
4. 路由系统 (routes/*.js)
   ↓
5. 中间件机制 (middlewares/auth.js)
   ↓
6. API设计与测试
```

## 第一步：核心概念理解

### 什么是Express.js？
Express.js是Node.js的一个Web应用框架，类似于：
- Java的Spring Boot
- Python的Flask/Django  
- PHP的Laravel

**核心概念：**
```javascript
// 1. 创建应用
const express = require('express');
const app = express();

// 2. 中间件（Middleware）- 处理请求的"流水线"
app.use(express.json()); // 解析JSON数据
app.use(cors()); // 允许跨域请求

// 3. 路由（Routes）- 定义API端点
app.get('/api/users', (req, res) => {
    // 处理GET请求
});

// 4. 启动服务器
app.listen(3000, () => {
    console.log('服务器启动在3000端口');
});
```

## 第二步：数据库层 (db.js, init_db.js)

### db.js - 数据库连接
```javascript
const Database = require('better-sqlite3');
const path = require('path');

// 创建数据库连接
const dbPath = path.join(__dirname, '..', 'db.sqlite');
const db = new Database(dbPath);

module.exports = db;
```

**作用：**
- 创建SQLite数据库连接
- 导出数据库实例供其他文件使用
- 类似于数据库连接池的概念

### init_db.js - 数据库初始化
```javascript
const db = require('./db');

// 创建用户表
db.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 创建任务表
db.exec(`
  CREATE TABLE IF NOT EXISTS task (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    reward INTEGER NOT NULL,
    min_level INTEGER DEFAULT 1,
    status TEXT DEFAULT 'OPEN',
    publisher_id INTEGER NOT NULL,
    taker_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (publisher_id) REFERENCES user(id),
    FOREIGN KEY (taker_id) REFERENCES user(id)
  )
`);
```

**作用：**
- 创建数据库表结构
- 只运行一次，相当于数据库的"安装程序"

## 第三步：服务器入口 (server.js)

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// =============  中间件配置 =============
app.use(cors()); // 允许跨域
app.use(express.json()); // 解析JSON请求体
app.use(express.static(path.join(__dirname, '..', 'frontend'))); // 静态文件服务

// =============  路由配置 =============
const tasksRouter = require('./routes/tasks');
const usersRouter = require('./routes/user');

app.use('/api', usersRouter); // 用户相关API
app.use('/api', tasksRouter); // 任务相关API

// =============  启动服务器 =============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器启动在端口 ${PORT}`);
});
```

**理解要点：**
1. **中间件顺序很重要** - 按顺序执行
2. **路由是模块化的** - 分离到不同文件
3. **静态文件服务** - 自动提供HTML/CSS/JS文件

## 第四步：路由系统 (routes/*.js)

### 路由的本质
路由就是"URL路径 + HTTP方法 + 处理函数"的组合：

```javascript
// GET /api/tasks - 获取所有任务
router.get('/tasks', (req, res) => {
    // 1. 从数据库查询数据
    const tasks = db.prepare('SELECT * FROM task').all();
    // 2. 返回JSON响应
    res.json(tasks);
});

// POST /api/tasks - 创建新任务  
router.post('/tasks', authenticate, (req, res) => {
    // 1. 从请求体获取数据
    const { title, description, reward } = req.body;
    // 2. 验证数据
    if (!title || !reward) {
        return res.status(400).json({ error: '缺少必要字段' });
    }
    // 3. 插入数据库
    const result = db.prepare(
        'INSERT INTO task (title, description, reward, publisher_id) VALUES (?, ?, ?, ?)'
    ).run(title, description, reward, req.userId);
    // 4. 返回结果
    res.status(201).json({ id: result.lastInsertRowid });
});
```

### 常见HTTP方法对应的操作
```
GET    - 查询/读取数据 (SELECT)
POST   - 创建新数据 (INSERT)  
PUT    - 更新全部数据 (UPDATE)
PATCH  - 更新部分数据 (UPDATE)
DELETE - 删除数据 (DELETE)
```

### routes/user.js 分析
```javascript
// 用户注册
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 1. 验证输入
        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码不能为空' });
        }
        
        // 2. 检查用户是否已存在
        const existingUser = db.prepare('SELECT id FROM user WHERE username = ?').get(username);
        if (existingUser) {
            return res.status(400).json({ error: '用户名已存在' });
        }
        
        // 3. 密码加密
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // 4. 保存到数据库
        const result = db.prepare(
            'INSERT INTO user (username, password_hash) VALUES (?, ?)'
        ).run(username, passwordHash);
        
        // 5. 返回成功响应
        res.status(201).json({ 
            id: result.lastInsertRowid, 
            username 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 1. 查找用户
        const user = db.prepare('SELECT * FROM user WHERE username = ?').get(username);
        if (!user) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        
        // 2. 验证密码
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        
        // 3. 生成JWT令牌
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        // 4. 返回登录成功信息
        res.json({
            token,
            userId: user.id,
            username: user.username
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
```

## 第五步：中间件机制 (middlewares/auth.js)

### 什么是中间件？
中间件是在请求和响应之间执行的函数，类似于"流水线上的工人"：

```javascript
// 请求流程：
// 客户端请求 → 中间件1 → 中间件2 → 路由处理函数 → 响应

// 认证中间件示例
const authenticate = (req, res, next) => {
    // 1. 获取令牌
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: '请提供认证令牌' });
    }
    
    try {
        // 2. 验证令牌
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // 3. 将用户信息添加到请求对象
        req.userId = decoded.userId;
        req.username = decoded.username;
        
        // 4. 调用next()继续下一个中间件或路由
        next();
    } catch (err) {
        res.status(401).json({ error: '无效的认证令牌' });
    }
};
```

### 中间件的使用
```javascript
// 全局中间件 - 所有请求都会经过
app.use(express.json());
app.use(cors());

// 路由级中间件 - 特定路由使用
router.post('/tasks', authenticate, (req, res) => {
    // 只有通过authenticate验证的请求才能到达这里
    // 此时req.userId已经被设置
});
```

## 第六步：API设计模式

### RESTful API设计原则
```
GET    /api/tasks          # 获取所有任务
GET    /api/tasks/:id      # 获取特定任务  
POST   /api/tasks          # 创建新任务
PUT    /api/tasks/:id      # 更新任务
DELETE /api/tasks/:id      # 删除任务

POST   /api/tasks/:id/accept  # 接取任务
POST   /api/tasks/:id/finish  # 完成任务
```

### 错误处理模式
```javascript
router.get('/tasks/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        // 验证ID
        if (!id || isNaN(id)) {
            return res.status(400).json({ error: '无效的任务ID' });
        }
        
        // 查询数据库
        const task = db.prepare('SELECT * FROM task WHERE id = ?').get(id);
        
        // 检查是否存在
        if (!task) {
            return res.status(404).json({ error: '任务不存在' });
        }
        
        // 返回成功结果
        res.json(task);
    } catch (err) {
        console.error('获取任务失败:', err);
        res.status(500).json({ error: '服务器内部错误' });
    }
});
```

## 学习建议

### 1. 实践顺序
```
1️⃣ 先理解数据库操作（增删改查）
2️⃣ 再学习路由和HTTP方法
3️⃣ 然后掌握中间件概念  
4️⃣ 最后整合完整的API
```

### 2. 调试技巧
```javascript
// 添加日志输出
console.log('收到请求:', req.method, req.url);
console.log('请求体:', req.body);
console.log('用户ID:', req.userId);

// 使用调试工具
// - Postman测试API
// - Chrome DevTools查看网络请求
// - VS Code断点调试
```

### 3. 常见错误避免
```javascript
// ❌ 忘记调用next()
app.use((req, res, next) => {
    console.log('中间件执行');
    // 忘记调用next()会导致请求挂起
});

// ✅ 正确做法
app.use((req, res, next) => {
    console.log('中间件执行');
    next(); // 必须调用
});

// ❌ 数据库操作不加错误处理
const user = db.prepare('SELECT * FROM user WHERE id = ?').get(userId);
res.json(user); // 如果查询出错会崩溃

// ✅ 正确做法
try {
    const user = db.prepare('SELECT * FROM user WHERE id = ?').get(userId);
    if (!user) {
        return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
} catch (err) {
    res.status(500).json({ error: err.message });
}
```

## 与前端的连接

### 前端如何调用后端API
```javascript
// frontend/js/api.js
async function makeRequest(endpoint, method = 'GET', body = null) {
    const config = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    
    // 添加认证令牌
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (body) {
        config.body = JSON.stringify(body);
    }
    
    const response = await fetch(`http://localhost:3000/api${endpoint}`, config);
    return response.json();
}

// 使用示例
const tasks = await makeRequest('/tasks'); // GET请求
const newTask = await makeRequest('/tasks', 'POST', { title: '新任务', reward: 100 });
```

## 总结

后端开发的核心就是：
1. **数据库操作** - 增删改查
2. **路由处理** - 接收请求，处理逻辑，返回响应  
3. **中间件** - 认证、日志、错误处理等通用功能
4. **API设计** - RESTful风格，统一的错误处理

从简单的CRUD操作开始，逐步理解每个组件的作用，然后组合成完整的Web应用。 