# HTML/CSS 命名规范指南

## 基本原则
- **语义化**: 名称要能表达元素的含义或功能
- **一致性**: 整个项目使用统一的命名风格
- **可读性**: 使用清晰、直观的名称

## HTML 命名规范

### ID 命名
```html
<!-- ✅ 推荐：短横线连接 -->
<div id="user-profile"></div>
<form id="login-form"></form>
<button id="submit-btn"></button>

<!-- ❌ 不推荐：驼峰命名 -->
<div id="userProfile"></div>
<form id="loginForm"></form>
```

### Class 命名（BEM方法论）
```html
<!-- 块级元素 -->
<div class="navigation">
  <!-- 元素 -->
  <ul class="navigation__list">
    <li class="navigation__item">
      <!-- 修饰符 -->
      <a class="navigation__link navigation__link--active">首页</a>
    </li>
  </ul>
</div>

<!-- 组件示例 -->
<div class="task-card">
  <h3 class="task-card__title">任务标题</h3>
  <p class="task-card__description">任务描述</p>
  <div class="task-card__footer">
    <span class="task-card__reward">¥100</span>
    <button class="task-card__btn task-card__btn--primary">接取</button>
  </div>
</div>
```

## CSS 组织结构

### 1. 文件组织
```
css/
├── base/           # 基础样式
│   ├── reset.css   # 重置样式
│   ├── variables.css # CSS变量
│   └── typography.css # 字体样式
├── components/     # 组件样式
│   ├── buttons.css
│   ├── forms.css
│   └── cards.css
├── layout/         # 布局样式
│   ├── header.css
│   ├── sidebar.css
│   └── footer.css
├── pages/          # 页面特定样式
│   ├── auth.css
│   └── tasks.css
└── utils/          # 工具类
    └── utilities.css
```

### 2. 选择器优先级
```css
/* 1. 标签选择器 */
body { }

/* 2. 类选择器 */
.container { }

/* 3. ID选择器（谨慎使用） */
#main-content { }

/* 4. 组合选择器 */
.nav .nav__item { }

/* 5. 状态选择器 */
.btn:hover { }
.btn.active { }
```

### 3. 属性书写顺序
```css
.example {
    /* 1. 定位 */
    position: relative;
    top: 0;
    left: 0;
    z-index: 1;
    
    /* 2. 盒模型 */
    display: flex;
    width: 100%;
    height: 50px;
    margin: 10px;
    padding: 10px;
    
    /* 3. 外观 */
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    
    /* 4. 字体 */
    font-family: Arial;
    font-size: 14px;
    color: #333;
    
    /* 5. 其他 */
    transition: all 0.3s;
    transform: translateX(0);
}
```

## 实际应用示例

### 修正后的认证表单
```html
<div class="auth-container">
  <div class="auth-card">
    <div class="auth-card__header">
      <h1 class="auth-card__title">用户登录</h1>
    </div>
    
    <form class="auth-form" id="login-form">
      <div class="form-group">
        <label class="form-group__label" for="login-username">用户名</label>
        <input 
          class="form-group__input" 
          type="text" 
          id="login-username" 
          name="username"
          placeholder="请输入用户名"
        >
      </div>
      
      <div class="form-group">
        <label class="form-group__label" for="login-password">密码</label>
        <input 
          class="form-group__input" 
          type="password" 
          id="login-password" 
          name="password"
          placeholder="请输入密码"
        >
      </div>
      
      <button class="btn btn--primary btn--full-width" type="submit">
        登录
      </button>
    </form>
  </div>
</div>
```

## 常见错误避免

### ❌ 不好的做法
```html
<!-- 名称不语义化 -->
<div class="box1"></div>
<div class="red-text"></div>

<!-- 使用样式描述 -->
<button class="blue-button"></button>
<div class="margin-top-20"></div>

<!-- 命名不一致 -->
<div class="userInfo"></div>
<div class="task-list"></div>
```

### ✅ 好的做法
```html
<!-- 语义化命名 -->
<div class="user-profile"></div>
<div class="error-message"></div>

<!-- 功能描述 -->
<button class="btn btn--submit"></button>
<div class="content-spacing"></div>

<!-- 命名一致 -->
<div class="user-info"></div>
<div class="task-list"></div>
``` 