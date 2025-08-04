# 实战练习指南

## 练习路径规划

```
基础练习 (1-3天)
├── HTML结构练习
├── CSS样式练习  
└── 基础JavaScript练习

中级练习 (3-5天)
├── API调用练习
├── 表单处理练习
└── 状态管理练习

高级练习 (5-7天)
├── 完整功能开发
├── 错误处理优化
└── 性能优化练习
```

## 基础练习

### 练习1：修正HTML/CSS命名规范
**目标：** 学会规范的HTML/CSS编写

**任务：**
1. 修改 `auth.html` 中的ID命名，改为短横线格式
2. 使用BEM方法论重新组织CSS类名
3. 提取通用样式到 `common.css`

**具体要求：**
```html
<!-- 原代码 -->
<input type="text" id="loginUsername" class="form-control">

<!-- 修改为 -->
<input type="text" id="login-username" class="form-group__input">
```

**检查标准：**
- [ ] 所有ID使用短横线命名
- [ ] CSS类使用BEM命名规范
- [ ] 通用样式提取到common.css
- [ ] 页面显示正常，功能不受影响

### 练习2：创建消息提示组件
**目标：** 学会创建可复用的UI组件

**任务：**
1. 创建 `js/components/message.js` 文件
2. 实现可配置的消息提示系统
3. 支持成功、错误、警告、信息四种类型

**参考实现：**
```javascript
// js/components/message.js
class MessageComponent {
    constructor(options = {}) {
        this.container = options.container || document.body;
        this.duration = options.duration || 4000;
    }
    
    show(message, type = 'info') {
        const messageEl = this.createElement(message, type);
        this.container.appendChild(messageEl);
        this.autoRemove(messageEl);
        return messageEl;
    }
    
    success(message) { return this.show(message, 'success'); }
    error(message) { return this.show(message, 'error'); }
    warning(message) { return this.show(message, 'warning'); }
    info(message) { return this.show(message, 'info'); }
    
    createElement(message, type) {
        // 实现消息元素创建逻辑
    }
    
    autoRemove(element) {
        // 实现自动移除逻辑
    }
}

// 导出全局实例
window.Message = new MessageComponent();
```

**检查标准：**
- [ ] 消息能正确显示和自动消失
- [ ] 支持四种消息类型
- [ ] 可以配置显示时长
- [ ] 样式美观，动画流畅

### 练习3：表单验证组件
**目标：** 学会前端数据验证

**任务：**
1. 创建通用的表单验证器
2. 实现常见验证规则（必填、长度、格式等）
3. 在注册表单中应用验证

**参考实现：**
```javascript
// js/components/validator.js
class FormValidator {
    constructor(form) {
        this.form = form;
        this.rules = {};
        this.errors = {};
    }
    
    addRule(fieldName, validators) {
        this.rules[fieldName] = validators;
        return this;
    }
    
    validate() {
        this.errors = {};
        let isValid = true;
        
        for (const [fieldName, validators] of Object.entries(this.rules)) {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            const value = field ? field.value.trim() : '';
            
            for (const validator of validators) {
                const result = validator.validate(value);
                if (!result.valid) {
                    this.errors[fieldName] = result.message;
                    isValid = false;
                    break;
                }
            }
        }
        
        this.displayErrors();
        return isValid;
    }
    
    displayErrors() {
        // 显示验证错误信息
    }
}

// 验证器工厂
const Validators = {
    required: (message = '此字段为必填项') => ({
        validate: (value) => ({
            valid: value.length > 0,
            message
        })
    }),
    
    minLength: (min, message) => ({
        validate: (value) => ({
            valid: value.length >= min,
            message: message || `最少需要${min}个字符`
        })
    }),
    
    pattern: (regex, message) => ({
        validate: (value) => ({
            valid: regex.test(value),
            message
        })
    })
};
```

**使用示例：**
```javascript
const validator = new FormValidator(document.getElementById('register-form'))
    .addRule('username', [
        Validators.required(),
        Validators.minLength(4, '用户名至少4个字符'),
        Validators.pattern(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线')
    ])
    .addRule('password', [
        Validators.required(),
        Validators.minLength(6, '密码至少6个字符')
    ]);

// 在表单提交时验证
form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validator.validate()) {
        // 提交表单
        handleRegister();
    }
});
```

## 中级练习

### 练习4：API状态管理
**目标：** 学会管理API请求状态

**任务：**
1. 创建API状态管理器
2. 实现加载状态、错误状态、成功状态的统一管理
3. 在任务列表页面应用

**参考实现：**
```javascript
// js/utils/api-state.js
class ApiStateManager {
    constructor() {
        this.states = new Map();
    }
    
    setLoading(key, isLoading = true) {
        const state = this.getState(key);
        state.loading = isLoading;
        if (isLoading) {
            state.error = null;
        }
        this.updateUI(key, state);
    }
    
    setSuccess(key, data = null) {
        const state = this.getState(key);
        state.loading = false;
        state.error = null;
        state.data = data;
        this.updateUI(key, state);
    }
    
    setError(key, error) {
        const state = this.getState(key);
        state.loading = false;
        state.error = error;
        this.updateUI(key, state);
    }
    
    getState(key) {
        if (!this.states.has(key)) {
            this.states.set(key, {
                loading: false,
                error: null,
                data: null
            });
        }
        return this.states.get(key);
    }
    
    updateUI(key, state) {
        const event = new CustomEvent('api-state-change', {
            detail: { key, state }
        });
        document.dispatchEvent(event);
    }
}

// 全局实例
window.ApiState = new ApiStateManager();
```

**使用示例：**
```javascript
// 在组件中使用
async function loadTasks() {
    try {
        ApiState.setLoading('tasks');
        const tasks = await taskAPI.getAllTasks();
        ApiState.setSuccess('tasks', tasks);
    } catch (error) {
        ApiState.setError('tasks', error.message);
    }
}

// 监听状态变化
document.addEventListener('api-state-change', (e) => {
    const { key, state } = e.detail;
    
    if (key === 'tasks') {
        updateTasksUI(state);
    }
});

function updateTasksUI(state) {
    const container = document.getElementById('tasks-container');
    
    if (state.loading) {
        container.innerHTML = '<div class="loading">加载中...</div>';
    } else if (state.error) {
        container.innerHTML = `<div class="error">加载失败: ${state.error}</div>`;
    } else if (state.data) {
        renderTasks(state.data);
    }
}
```

### 练习5：任务筛选功能
**目标：** 实现复杂的前端数据处理

**任务：**
1. 添加任务筛选功能（按状态、悬赏金额、发布时间）
2. 实现搜索功能
3. 添加排序功能

**HTML结构：**
```html
<div class="filter-panel">
    <div class="filter-group">
        <label>状态筛选：</label>
        <select id="status-filter">
            <option value="">全部</option>
            <option value="OPEN">招募中</option>
            <option value="TAKEN">进行中</option>
            <option value="COMPLETED">已完成</option>
        </select>
    </div>
    
    <div class="filter-group">
        <label>悬赏范围：</label>
        <input type="number" id="min-reward" placeholder="最低金额">
        <input type="number" id="max-reward" placeholder="最高金额">
    </div>
    
    <div class="filter-group">
        <label>搜索：</label>
        <input type="text" id="search-input" placeholder="搜索任务标题或描述">
    </div>
    
    <div class="filter-group">
        <label>排序：</label>
        <select id="sort-select">
            <option value="created_at">发布时间</option>
            <option value="reward">悬赏金额</option>
            <option value="title">任务标题</option>
        </select>
        <select id="sort-order">
            <option value="desc">降序</option>
            <option value="asc">升序</option>
        </select>
    </div>
</div>
```

**JavaScript实现：**
```javascript
class TaskFilter {
    constructor(tasks = []) {
        this.originalTasks = tasks;
        this.filteredTasks = tasks;
        this.filters = {
            status: '',
            minReward: null,
            maxReward: null,
            search: '',
            sortBy: 'created_at',
            sortOrder: 'desc'
        };
    }
    
    updateTasks(tasks) {
        this.originalTasks = tasks;
        this.applyFilters();
    }
    
    setFilter(key, value) {
        this.filters[key] = value;
        this.applyFilters();
    }
    
    applyFilters() {
        let tasks = [...this.originalTasks];
        
        // 状态筛选
        if (this.filters.status) {
            tasks = tasks.filter(task => task.status === this.filters.status);
        }
        
        // 悬赏范围筛选
        if (this.filters.minReward !== null) {
            tasks = tasks.filter(task => task.reward >= this.filters.minReward);
        }
        if (this.filters.maxReward !== null) {
            tasks = tasks.filter(task => task.reward <= this.filters.maxReward);
        }
        
        // 搜索筛选
        if (this.filters.search) {
            const searchLower = this.filters.search.toLowerCase();
            tasks = tasks.filter(task => 
                task.title.toLowerCase().includes(searchLower) ||
                task.description.toLowerCase().includes(searchLower)
            );
        }
        
        // 排序
        tasks.sort((a, b) => {
            const aValue = a[this.filters.sortBy];
            const bValue = b[this.filters.sortBy];
            const modifier = this.filters.sortOrder === 'desc' ? -1 : 1;
            
            if (aValue < bValue) return -1 * modifier;
            if (aValue > bValue) return 1 * modifier;
            return 0;
        });
        
        this.filteredTasks = tasks;
        this.onFilterChange(this.filteredTasks);
    }
    
    onFilterChange(filteredTasks) {
        // 子类可以重写此方法
        const event = new CustomEvent('tasks-filtered', {
            detail: { tasks: filteredTasks }
        });
        document.dispatchEvent(event);
    }
}

// 使用示例
const taskFilter = new TaskFilter();

// 绑定筛选控件事件
document.getElementById('status-filter').addEventListener('change', (e) => {
    taskFilter.setFilter('status', e.target.value);
});

document.getElementById('search-input').addEventListener('input', (e) => {
    taskFilter.setFilter('search', e.target.value);
});

// 监听筛选结果
document.addEventListener('tasks-filtered', (e) => {
    renderTasks(e.detail.tasks);
});
```

## 高级练习

### 练习6：任务详情弹窗
**目标：** 创建复杂的交互组件

**任务：**
1. 创建任务详情弹窗组件
2. 实现弹窗的打开、关闭、动画效果
3. 在弹窗中可以接取任务、查看详情

**实现要求：**
```javascript
class TaskModal {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.currentTask = null;
    }
    
    async show(taskId) {
        try {
            const task = await taskAPI.getTaskById(taskId);
            this.currentTask = task;
            this.render();
            this.open();
        } catch (error) {
            Message.error('加载任务详情失败');
        }
    }
    
    render() {
        if (!this.modal) {
            this.createModal();
        }
        this.updateContent();
    }
    
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'task-modal';
        this.modal.innerHTML = `
            <div class="task-modal__backdrop"></div>
            <div class="task-modal__content">
                <div class="task-modal__header">
                    <h2 class="task-modal__title"></h2>
                    <button class="task-modal__close">&times;</button>
                </div>
                <div class="task-modal__body">
                    <!-- 任务详情内容 -->
                </div>
                <div class="task-modal__footer">
                    <!-- 操作按钮 -->
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modal);
        this.bindEvents();
    }
    
    updateContent() {
        // 更新弹窗内容
        const title = this.modal.querySelector('.task-modal__title');
        title.textContent = this.currentTask.title;
        
        // 更新其他内容...
    }
    
    bindEvents() {
        // 关闭按钮
        this.modal.querySelector('.task-modal__close').addEventListener('click', () => {
            this.close();
        });
        
        // 背景点击关闭
        this.modal.querySelector('.task-modal__backdrop').addEventListener('click', () => {
            this.close();
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    open() {
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // 防止背景滚动
        
        // 触发动画
        setTimeout(() => {
            this.modal.classList.add('task-modal--open');
        }, 10);
        
        this.isOpen = true;
    }
    
    close() {
        this.modal.classList.remove('task-modal--open');
        
        setTimeout(() => {
            this.modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300); // 等待动画完成
        
        this.isOpen = false;
    }
}

// CSS样式
const modalStyles = `
.task-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.task-modal__backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.task-modal__content {
    position: relative;
    background: white;
    border-radius: 12px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow: auto;
    transform: scale(0.8);
    transition: transform 0.3s ease;
}

.task-modal--open .task-modal__backdrop {
    opacity: 1;
}

.task-modal--open .task-modal__content {
    transform: scale(1);
}
`;
```

### 练习7：实时数据更新
**目标：** 学会处理动态数据

**任务：**
1. 实现定时刷新任务列表
2. 添加手动刷新功能
3. 实现乐观更新（先更新UI，再同步服务器）

**参考实现：**
```javascript
class TaskManager {
    constructor() {
        this.tasks = [];
        this.refreshInterval = null;
        this.autoRefresh = true;
        this.refreshDelay = 30000; // 30秒
    }
    
    async initialize() {
        await this.loadTasks();
        this.startAutoRefresh();
    }
    
    async loadTasks() {
        try {
            ApiState.setLoading('tasks');
            this.tasks = await taskAPI.getAllTasks();
            ApiState.setSuccess('tasks', this.tasks);
            this.renderTasks();
        } catch (error) {
            ApiState.setError('tasks', error.message);
        }
    }
    
    async refreshTasks() {
        try {
            const newTasks = await taskAPI.getAllTasks();
            const changes = this.detectChanges(this.tasks, newTasks);
            
            if (changes.length > 0) {
                this.tasks = newTasks;
                this.renderTasks();
                this.showChangeNotifications(changes);
            }
        } catch (error) {
            console.error('刷新任务失败:', error);
        }
    }
    
    detectChanges(oldTasks, newTasks) {
        const changes = [];
        
        // 检测新增任务
        newTasks.forEach(newTask => {
            const oldTask = oldTasks.find(t => t.id === newTask.id);
            if (!oldTask) {
                changes.push({ type: 'added', task: newTask });
            } else if (JSON.stringify(oldTask) !== JSON.stringify(newTask)) {
                changes.push({ type: 'updated', task: newTask, oldTask });
            }
        });
        
        // 检测删除的任务
        oldTasks.forEach(oldTask => {
            const newTask = newTasks.find(t => t.id === oldTask.id);
            if (!newTask) {
                changes.push({ type: 'removed', task: oldTask });
            }
        });
        
        return changes;
    }
    
    showChangeNotifications(changes) {
        changes.forEach(change => {
            switch (change.type) {
                case 'added':
                    Message.info(`新任务：${change.task.title}`);
                    break;
                case 'updated':
                    Message.info(`任务更新：${change.task.title}`);
                    break;
                case 'removed':
                    Message.warning(`任务已移除：${change.task.title}`);
                    break;
            }
        });
    }
    
    // 乐观更新：先更新UI，再同步服务器
    async acceptTaskOptimistic(taskId) {
        // 1. 立即更新UI
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const originalTask = { ...this.tasks[taskIndex] };
            this.tasks[taskIndex].status = 'TAKEN';
            this.tasks[taskIndex].taker_id = getCurrentUserId();
            this.renderTasks();
        }
        
        try {
            // 2. 同步到服务器
            await taskAPI.acceptTask(taskId, getCurrentUserId());
            Message.success('接取任务成功');
        } catch (error) {
            // 3. 失败时回滚
            if (taskIndex !== -1) {
                this.tasks[taskIndex] = originalTask;
                this.renderTasks();
            }
            Message.error('接取任务失败');
        }
    }
    
    startAutoRefresh() {
        if (this.autoRefresh && !this.refreshInterval) {
            this.refreshInterval = setInterval(() => {
                this.refreshTasks();
            }, this.refreshDelay);
        }
    }
    
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    renderTasks() {
        // 渲染任务列表
        const container = document.getElementById('tasks-container');
        container.innerHTML = this.tasks.map(task => this.renderTaskCard(task)).join('');
    }
    
    renderTaskCard(task) {
        return `
            <div class="task-card" data-task-id="${task.id}">
                <h3>${task.title}</h3>
                <p>${task.description}</p>
                <div class="task-reward">¥${task.reward}</div>
                <div class="task-status status-${task.status.toLowerCase()}">${this.getStatusText(task.status)}</div>
                ${this.renderTaskActions(task)}
            </div>
        `;
    }
}

// 使用
const taskManager = new TaskManager();
taskManager.initialize();
```

## 检查清单

### 基础技能检查
- [ ] 能写出语义化的HTML结构
- [ ] 能使用规范的CSS命名约定
- [ ] 理解CSS选择器优先级
- [ ] 掌握基础的JavaScript语法
- [ ] 理解DOM操作和事件处理

### 中级技能检查
- [ ] 能封装可复用的JavaScript组件
- [ ] 理解异步编程（Promise/async-await）
- [ ] 能处理API调用和错误
- [ ] 掌握前端数据管理
- [ ] 能实现复杂的用户交互

### 高级技能检查
- [ ] 能设计和实现完整的功能模块
- [ ] 理解前后端数据流
- [ ] 能优化性能和用户体验
- [ ] 掌握错误处理和状态管理
- [ ] 能编写可维护的代码

## 学习建议

1. **循序渐进**：从基础练习开始，不要跳跃
2. **动手实践**：每个练习都要亲自编写代码
3. **理解原理**：不要只是复制代码，要理解为什么这样写
4. **多调试**：使用浏览器开发者工具调试代码
5. **写注释**：为自己的代码写清楚的注释
6. **看文档**：遇到不懂的API要查看官方文档
7. **持续练习**：编程需要大量练习才能熟练

完成这些练习后，你就能独立开发前端功能了！ 