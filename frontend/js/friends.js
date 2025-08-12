import { friendAPI } from './api.js';

class FriendsManager {
    constructor() {
        this.currentTab = 'search';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadFriendRequests(); // 加载好友申请数量
        this.loadFriends(); // 预加载好友列表
    }

    setupEventListeners() {
        // 标签页切换
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });

        // 搜索功能
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        
        searchBtn.addEventListener('click', () => this.searchUsers());
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchUsers();
            }
        });
    }

    switchTab(tabName) {
        // 更新标签按钮状态
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 显示对应内容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;

        // 加载对应数据
        if (tabName === 'friends') {
            this.loadFriends();
        } else if (tabName === 'requests') {
            this.loadFriendRequests();
        }
    }

    async searchUsers() {
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');
        const query = searchInput.value.trim();

        if (!query) {
            this.showMessage('请输入要搜索的用户名', 'warning');
            return;
        }

        this.showLoading(searchResults);

        try {
            const response = await friendAPI.searchUsers(query);
            this.renderSearchResults(response.users);
        } catch (error) {
            console.error('搜索用户失败:', error);
            this.showError(searchResults, '搜索用户失败: ' + error.message);
        }
    }

    renderSearchResults(users) {
        const container = document.getElementById('searchResults');
        
        if (!users || users.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>未找到用户</h3>
                    <p>请尝试其他关键词</p>
                </div>
            `;
            return;
        }

        container.innerHTML = users.map(user => `
            <div class="user-card">
                <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                    <div class="user-name">${this.escapeHtml(user.username)}</div>
                    <div class="user-level">等级: ${user.level}</div>
                </div>
                <div class="user-actions">
                    ${this.renderFriendshipAction(user)}
                </div>
            </div>
        `).join('');

        // 绑定按钮事件
        this.bindSearchResultActions();
    }

    renderFriendshipAction(user) {
        switch (user.friendshipStatus) {
            case 'accepted':
                return '<span class="status-text">已是好友</span>';
            case 'pending':
                return '<span class="status-text">申请已发送</span>';
            case 'rejected':
                return `<button class="action-btn btn-add" onclick="friendsManager.sendFriendRequest(${user.id})">重新申请</button>`;
            default:
                return `<button class="action-btn btn-add" onclick="friendsManager.sendFriendRequest(${user.id})">添加好友</button>`;
        }
    }

    bindSearchResultActions() {
        // 事件已通过onclick绑定到全局函数
    }

    async sendFriendRequest(friendId) {
        try {
            await friendAPI.sendFriendRequest(friendId);
            this.showMessage('好友申请发送成功', 'success');
            // 重新搜索以更新状态
            this.searchUsers();
        } catch (error) {
            console.error('发送好友申请失败:', error);
            this.showMessage('发送好友申请失败: ' + error.message, 'error');
        }
    }

    async loadFriends() {
        const container = document.getElementById('friendsList');
        this.showLoading(container);

        try {
            const response = await friendAPI.getFriends();
            this.renderFriends(response.friends);
        } catch (error) {
            console.error('加载好友列表失败:', error);
            this.showError(container, '加载好友列表失败: ' + error.message);
        }
    }

    renderFriends(friends) {
        const container = document.getElementById('friendsList');
        
        if (!friends || friends.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>暂无好友</h3>
                    <p>去搜索页面添加一些好友吧！</p>
                </div>
            `;
            return;
        }

        container.innerHTML = friends.map(friend => `
            <div class="friend-card">
                <div class="user-avatar">${friend.username.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                    <div class="user-name">${this.escapeHtml(friend.username)}</div>
                    <div class="user-level">等级: ${friend.level}</div>
                    <div class="request-time">成为好友: ${this.formatDate(friend.friend_since)}</div>
                </div>
                <div class="user-actions">
                    <button class="action-btn btn-chat" onclick="friendsManager.startChat(${friend.id})">
                        <i class="fas fa-comments"></i> 聊天
                    </button>
                    <button class="action-btn btn-remove" onclick="friendsManager.removeFriend(${friend.id}, '${this.escapeHtml(friend.username)}')">
                        <i class="fas fa-user-minus"></i> 删除
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadFriendRequests() {
        const container = document.getElementById('requestsList');
        this.showLoading(container);

        try {
            const response = await friendAPI.getFriendRequests();
            this.renderFriendRequests(response.requests);
            this.updateRequestBadge(response.requests.length);
        } catch (error) {
            console.error('加载好友申请失败:', error);
            this.showError(container, '加载好友申请失败: ' + error.message);
        }
    }

    renderFriendRequests(requests) {
        const container = document.getElementById('requestsList');
        
        if (!requests || requests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-plus"></i>
                    <h3>暂无好友申请</h3>
                    <p>还没有人向你发送好友申请</p>
                </div>
            `;
            return;
        }

        container.innerHTML = requests.map(request => `
            <div class="request-card">
                <div class="user-avatar">${request.username.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                    <div class="user-name">${this.escapeHtml(request.username)}</div>
                    <div class="user-level">等级: ${request.level}</div>
                    <div class="request-time">${this.formatDate(request.created_at)}</div>
                </div>
                <div class="user-actions">
                    <button class="action-btn btn-accept" onclick="friendsManager.respondToRequest(${request.id}, 'accept')">
                        <i class="fas fa-check"></i> 接受
                    </button>
                    <button class="action-btn btn-reject" onclick="friendsManager.respondToRequest(${request.id}, 'reject')">
                        <i class="fas fa-times"></i> 拒绝
                    </button>
                </div>
            </div>
        `).join('');
    }

    async respondToRequest(requestId, action) {
        try {
            await friendAPI.respondToRequest(requestId, action);
            const actionText = action === 'accept' ? '接受' : '拒绝';
            this.showMessage(`已${actionText}好友申请`, 'success');
            
            // 重新加载申请列表
            this.loadFriendRequests();
            
            // 如果接受了申请，也重新加载好友列表
            if (action === 'accept') {
                this.loadFriends();
            }
        } catch (error) {
            console.error('处理好友申请失败:', error);
            this.showMessage('处理好友申请失败: ' + error.message, 'error');
        }
    }

    async removeFriend(friendId, friendName) {
        if (!confirm(`确定要删除好友 "${friendName}" 吗？`)) {
            return;
        }

        try {
            await friendAPI.removeFriend(friendId);
            this.showMessage('好友删除成功', 'success');
            this.loadFriends();
        } catch (error) {
            console.error('删除好友失败:', error);
            this.showMessage('删除好友失败: ' + error.message, 'error');
        }
    }

    startChat(friendId) {
        // 跳转到聊天页面
        window.location.href = `chat.html?friend=${friendId}`;
    }

    updateRequestBadge(count) {
        const badge = document.getElementById('requestBadge');
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    }

    showLoading(container) {
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner"></i>
                <p>加载中...</p>
            </div>
        `;
    }

    showError(container, message) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle" style="color: #da3633;"></i>
                <h3>加载失败</h3>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
    }

    showMessage(message, type = 'info') {
        // 创建消息提示
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#238636' : type === 'error' ? '#da3633' : '#58a6ff'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        messageEl.textContent = message;

        document.body.appendChild(messageEl);

        // 显示动画
        setTimeout(() => {
            messageEl.style.opacity = '1';
            messageEl.style.transform = 'translateX(0)';
        }, 10);

        // 自动隐藏
        setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(messageEl);
            }, 300);
        }, 3000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return '今天';
        } else if (diffDays <= 7) {
            return `${diffDays}天前`;
        } else {
            return date.toLocaleDateString('zh-CN');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化好友管理器
const friendsManager = new FriendsManager();

// 导出到全局作用域供HTML调用
window.friendsManager = friendsManager;
