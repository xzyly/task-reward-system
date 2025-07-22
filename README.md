# 🏆 任务悬赏平台

> 🚀 一个现代化的任务悬赏平台，连接技能与需求，创造价值与机会

专业的任务悬赏平台，发布者可以发布各种任务需求，接单者可以展示自己的技能并获得报酬。基于 Node.js + Express + SQLite 构建，拥有美观的现代化界面和完善的用户体验。

## ✨ 功能特色

### 🎯 核心功能
- **🏠 美观首页** - 现代化设计，响应式布局，动态统计展示
- **👥 用户系统** - 完整的注册/登录体系，JWT认证保障安全
- **📋 任务管理** - 发布、浏览、接取、完成任务的完整流程
- **💰 悬赏机制** - 透明的悬赏金额设置和管理
- **🏷️ 任务分类** - 设计、开发、写作、翻译等多领域支持
- **⭐ 等级体系** - 用户等级要求，提升服务质量

### 🔐 安全特性
- **JWT身份认证** - 安全的用户身份验证
- **密码加密** - bcrypt加密存储用户密码
- **并发控制** - 防止重复抢单的事务机制
- **数据验证** - 完善的前后端数据验证

### 🎨 用户体验
- **响应式设计** - 完美适配手机、平板、电脑
- **现代化UI** - 磨砂玻璃效果、渐变色彩、平滑动画
- **直观操作** - 简洁明了的用户界面和交互流程
- **实时反馈** - 美观的消息提示和状态更新

## 🚀 快速开始

### 📋 环境要求

- **Node.js** >= 14.0
- **npm** >= 6.0
- 支持的操作系统：Windows、macOS、Linux

### 🔧 手动启动

1. **克隆项目**
```bash
git clone [项目地址]
cd Task
```

2. **安装依赖**
```bash
npm install
```

3. **初始化数据库**
```bash
node backend/init_db.js
```

4. **插入示例数据**
```bash
node backend/insert_sample_data_fixed.js
```

5. **启动服务器**
```bash
node backend/server.js
```

6. **访问应用**
打开浏览器访问 http://localhost:3000

## 🌐 访问地址

| 页面 | 地址 | 描述 |
|------|------|------|
| 🏠 首页 | http://localhost:3000 | 平台介绍和统计信息 |
| 📋 任务列表 | http://localhost:3000/taskList.html | 浏览和筛选任务 |
| 🔐 登录注册 | http://localhost:3000/auth.html | 用户认证系统 |
| ➕ 发布任务 | http://localhost:3000/publishTask.html | 创建新任务 |
| 👤 个人中心 | http://localhost:3000/myself.html | 个人信息和我的任务 |
| 📄 任务详情 | http://localhost:3000/detail.html?id=1 | 查看任务详细信息 |
| 📚 API文档 | http://localhost:3000/api-docs | Swagger API文档 |

## 🛠️ 技术栈

### 后端技术
- **🟢 Node.js** - 服务器运行环境
- **⚡ Express.js** - Web应用框架
- **🗄️ SQLite** - 轻量级数据库
- **🔒 JWT** - 身份认证
- **🛡️ bcrypt** - 密码加密
- **📖 Swagger** - API文档生成

### 前端技术
- **🌐 HTML5** - 页面结构
- **🎨 CSS3** - 现代化样式设计
- **⚡ JavaScript ES6+** - 交互逻辑
- **📱 响应式设计** - 移动端适配
- **🎪 Font Awesome** - 图标库

### 开发工具
- **🧪 Jest** - 单元测试框架
- **🔍 Supertest** - API测试工具
- **📝 JSDoc** - 代码文档

## 📁 项目结构

```
Task/
├── 📁 backend/                    # 后端代码
│   ├── 📁 routes/
│   │   ├── 📄 tasks.js           # 任务相关API路由
│   │   ├── 📄 user.js            # 用户相关API路由
│   │   └── 📄 publishTask.js     # 发布任务路由
│   ├── 📁 middlewares/
│   │   └── 📄 auth.js            # JWT认证中间件
│   ├── 📁 tests/                 # 测试文件
│   │   ├── 📄 auth.test.js
│   │   ├── 📄 tasks.test.js
│   │   └── 📁 helpers/
│   ├── 📄 server.js              # 服务器入口
│   ├── 📄 db.js                  # 数据库配置
│   ├── 📄 init_db.js             # 数据库初始化
│   ├── 📄 swagger.js             # API文档配置
│   └── 📄 ecosystem.config.js    # PM2配置
├── 📁 frontend/                   # 前端代码
│   ├── 📁 css/
│   │   └── 📄 common.css         # 通用样式
│   ├── 📁 js/
│   │   ├── 📄 api.js             # API调用封装
│   │   ├── 📄 auth.js            # 认证逻辑
│   │   └── 📄 utils.js           # 工具函数
│   ├── 📄 index.html             # 首页
│   ├── 📄 taskList.html          # 任务列表
│   ├── 📄 auth.html              # 登录注册
│   ├── 📄 publishTask.html       # 发布任务
│   ├── 📄 myself.html            # 个人中心
│   ├── 📄 detail.html            # 任务详情
│   └── 📄 navbar.html            # 导航栏组件
├── 📁 docs/                      # 项目文档
│   └── 📄 er.md                  # 数据库设计
├── 📄 db.sqlite                  # SQLite数据库
├── 📄 package.json               # 项目依赖
├── 📄 start.bat                  # Windows启动脚本
├── 📄 start.sh                   # Linux/Mac启动脚本
└── 📄 README.md                  # 项目说明
```

## 🗄️ 数据库设计

### 用户表 (user)
| 字段 | 类型 | 描述 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 用户唯一标识 |
| username | TEXT UNIQUE | 用户名（4-16位） |
| password_hash | TEXT | 密码哈希值 |
| level | INTEGER DEFAULT 1 | 用户等级 |
| created_at | DATETIME DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 任务表 (task)
| 字段 | 类型 | 描述 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 任务唯一标识 |
| title | TEXT | 任务标题 |
| description | TEXT | 任务描述 |
| reward | INTEGER | 悬赏金额（分） |
| min_level | INTEGER DEFAULT 1 | 最低等级要求 |
| status | TEXT DEFAULT 'OPEN' | 任务状态 |
| publisher_id | INTEGER | 发布者ID |
| taker_id | INTEGER | 接单者ID |
| created_at | DATETIME DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 任务状态说明
- **OPEN** - 招募中
- **TAKEN** - 进行中
- **COMPLETED** - 已完成

## 📚 API 文档

### 认证相关

#### 用户注册
```http
POST /api/register
Content-Type: application/json

{
  "username": "用户名",
  "password": "密码"
}
```

#### 用户登录
```http
POST /api/login
Content-Type: application/json

{
  "username": "用户名", 
  "password": "密码"
}
```

### 任务相关

#### 获取所有任务
```http
GET /api/tasks
```

#### 获取任务详情
```http
GET /api/tasks/:id
```

#### 发布新任务
```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "任务标题",
  "description": "任务描述", 
  "reward": 500,
  "min_level": 1
}
```

#### 接取任务
```http
POST /api/tasks/:id/accept
Content-Type: application/json

{
  "taker_id": 2
}
```

#### 完成任务
```http
POST /api/tasks/:id/finish
Authorization: Bearer <token>
```

#### 获取我的任务
```http
GET /api/tasks/my/:takerId
Authorization: Bearer <token>
```

> 💡 **提示：** 完整的API文档可在 http://localhost:3000/api-docs 查看

## 🧪 测试

### 运行测试
```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch
```

### 测试覆盖
- ✅ 用户认证测试
- ✅ 任务CRUD操作测试
- ✅ 任务状态流转测试
- ✅ 并发安全测试

## 🚀 部署指南

### 开发环境
```bash
# 克隆项目
git clone [项目地址]
cd Task

# 安装依赖
npm install

# 启动开发服务器
npm start
```

### 生产环境

#### 使用PM2部署
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start backend/ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs
```

#### 使用Docker部署
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000

CMD ["node", "backend/server.js"]
```

## 🔧 开发状态

### ✅ 已完成功能
- [x] 🏠 美观的现代化首页
- [x] 👥 完整的用户认证系统
- [x] 📋 任务发布和管理功能
- [x] 💰 悬赏金额设置
- [x] 🏷️ 任务分类和筛选
- [x] 👤 个人中心和我的任务
- [x] 🔐 JWT身份认证
- [x] 🛡️ 密码加密存储
- [x] 📱 响应式移动端适配
- [x] 🎨 现代化UI设计
- [x] 📚 Swagger API文档
- [x] 🧪 单元测试覆盖

### 🔄 开发中功能
- [ ] 💳 支付系统集成
- [ ] ⭐ 任务评价和评分
- [ ] 💬 实时消息通知
- [ ] 📊 数据统计和分析

### 📋 待开发功能
- [ ] 🔔 邮件通知系统
- [ ] 🌍 多语言支持
- [ ] 📈 高级数据分析
- [ ] 🤖 AI任务推荐
- [ ] 📱 移动端APP

## 🤝 贡献指南

### 开发规范
- **代码风格** - 使用 2 空格缩进，遵循 ESLint 规范
- **命名规范** - 变量使用驼峰命名，数据库字段使用下划线
- **注释规范** - 使用 JSDoc 格式编写函数注释
- **提交规范** - 使用 Conventional Commits 格式

### 参与开发
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## ❓ 常见问题

<details>
<summary><strong>Q: 如何重置数据库？</strong></summary>

```bash
# 删除现有数据库
rm db.sqlite

# 重新初始化
node backend/init_db.js
node backend/insert_sample_data_fixed.js
```
</details>

<details>
<summary><strong>Q: 如何修改服务器端口？</strong></summary>

在 `backend/server.js` 中修改端口号：
```javascript
const PORT = process.env.PORT || 3000;
```
</details>

<details>
<summary><strong>Q: 如何添加新的任务分类？</strong></summary>

在前端 `publishTask.html` 中的分类选择器中添加新选项。
</details>

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者们！

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个 Star！**

*让技能与需求完美匹配，创造更多价值与机会* 🚀

</div>