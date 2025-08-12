// 导航栏管理类
class NavbarManager {
    constructor() {
        this.init();
        this.friendsWidget = null;
    }

    init() {
        this.checkAuthStatus();
        this.setActivePage();
        this.initializeFriendsWidget();
    }

    // 检查登录状态
    checkAuthStatus() {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const userData = localStorage.getItem('userData');
        const username = localStorage.getItem('username');

        const authButtons = document.getElementById('authButtons');
        const userInfo = document.getElementById('userInfo');
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');

        if (token && (userData || username)) {
            // 已登录状态
            if (authButtons) authButtons.style.display = 'none';
            if (userInfo) userInfo.style.display = 'flex';
            
            let displayName = username;
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    displayName = user.username || user.name || username;
                } catch (e) {
                    console.warn('解析用户数据失败:', e);
                }
            }
            
            if (userName) userName.textContent = displayName || '用户';
            if (userAvatar) userAvatar.textContent = (displayName || 'U').charAt(0).toUpperCase();
        } else {
            // 未登录状态
            if (authButtons) authButtons.style.display = 'flex';
            if (userInfo) userInfo.style.display = 'none';
        }
    }

    // 设置当前页面高亮
    setActivePage() {
        const currentPage = this.getCurrentPageName();
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === currentPage) {
                link.classList.add('active');
            }
        });
    }

    // 获取当前页面名称
    getCurrentPageName() {
        const path = window.location.pathname;
        const fileName = path.split('/').pop().split('.')[0];
        
        // 页面映射
        const pageMap = {
            'taskList': 'taskList',
            'index': 'taskList',
            '': 'taskList',
            'publishTask': 'publishTask', 
            'friends': 'friends',
            'chat': 'chat',
            'myself': 'myself',
            'detail': 'taskList' // 详情页归属到任务列表
        };

        return pageMap[fileName] || 'taskList';
    }

    // 更新用户信息
    updateUserInfo(userInfo) {
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userName && userInfo.username) {
            userName.textContent = userInfo.username;
            userAvatar.textContent = userInfo.username.charAt(0).toUpperCase();
        }
        
        this.checkAuthStatus();
    }

    // 初始化好友功能组件
    initializeFriendsWidget() {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (token) {
            this.friendsWidget = new NavbarFriendsWidget();
            this.setupFriendsDropdown();
        }
    }

    // 设置好友下拉菜单
    setupFriendsDropdown() {
        const friendsDropdown = document.getElementById('friendsDropdown');
        const dropdownToggle = friendsDropdown ? friendsDropdown.querySelector('.dropdown-toggle') : null;
        const dropdownContent = document.getElementById('friendsDropdownContent');

        if (friendsDropdown && dropdownToggle && dropdownContent) {
            friendsDropdown.style.display = 'block';

            // 点击切换下拉菜单
            dropdownToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleFriendsDropdown();
            });

            // 点击页面其他地方关闭下拉菜单
            document.addEventListener('click', (e) => {
                if (!friendsDropdown.contains(e.target)) {
                    this.closeFriendsDropdown();
                }
            });

            // 防止下拉菜单内部点击关闭菜单
            dropdownContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }

    // 切换好友下拉菜单
    toggleFriendsDropdown() {
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const dropdownContent = document.getElementById('friendsDropdownContent');
        
        if (dropdownContent && dropdownContent.classList.contains('show')) {
            this.closeFriendsDropdown();
        } else {
            this.openFriendsDropdown();
        }
    }

    // 打开好友下拉菜单
    openFriendsDropdown() {
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const dropdownContent = document.getElementById('friendsDropdownContent');
        
        if (dropdownToggle) dropdownToggle.classList.add('active');
        if (dropdownContent) dropdownContent.classList.add('show');
        
        // 加载好友数据
        if (this.friendsWidget) {
            this.friendsWidget.loadAllData();
        }
    }

    // 关闭好友下拉菜单
    closeFriendsDropdown() {
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const dropdownContent = document.getElementById('friendsDropdownContent');
        
        if (dropdownToggle) dropdownToggle.classList.remove('active');
        if (dropdownContent) dropdownContent.classList.remove('show');
    }
}

// 导航栏好友功能组件
class NavbarFriendsWidget {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 搜索功能
        const searchBtn = document.getElementById('navSearchBtn');
        const searchInput = document.getElementById('navSearchInput');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchUsers());
        }
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchUsers();
                }
            });
        }
    }

    // 加载所有数据
    async loadAllData() {
        try {
            await Promise.all([
                this.loadFriendRequests(),
                this.loadFriends()
            ]);
        } catch (error) {
            console.error('加载好友数据失败:', error);
        }
    }

    // 搜索用户
            async searchUsers() {
        const searchInput = document.getElementById('navSearchInput');
        const resultsContainer = document.getElementById('navSearchResults');
        const query = searchInput ? searchInput.value.trim() : '';

        if (!query) {
            if (resultsContainer) resultsContainer.innerHTML = '<div class="empty-message">请输入用户名</div>';
            return;
        }

        if (resultsContainer) resultsContainer.innerHTML = '<div class="empty-message">搜索中...</div>';

        try {
            const response = await this.makeRequest(`/friends/search?username=${encodeURIComponent(query)}`, 'GET');
            this.renderSearchResults(response.users || []);
        } catch (error) {
            console.error('搜索用户失败:', error);
            if (resultsContainer) resultsContainer.innerHTML = '<div class="empty-message">搜索失败</div>';
        }
    }

    // 渲染搜索结果
    renderSearchResults(users) {
        const container = document.getElementById('navSearchResults');
        if (!container) return;
        
        if (!users || users.length === 0) {
            container.innerHTML = '<div class="empty-message">未找到用户</div>';
            return;
        }

        container.innerHTML = users.slice(0, 3).map(user => `
            <div class="user-item">
                <div class="user-avatar-small">${user.username.charAt(0).toUpperCase()}</div>
                <div class="user-info-small">
                    <div class="user-name-small">${this.escapeHtml(user.username)}</div>
                    <div class="user-level-small">等级: ${user.level || 1}</div>
                </div>
                <div class="user-action-small">
                    ${this.renderFriendshipAction(user)}
                </div>
            </div>
        `).join('');
    }

    // 渲染好友关系操作
    renderFriendshipAction(user) {
        switch (user.friendshipStatus) {
            case 'accepted':
                return '<span class="status-text-small">已是好友</span>';
            case 'pending':
                return '<span class="status-text-small">已申请</span>';
            case 'rejected':
                return `<button class="action-btn-small btn-add-small" onclick="navbarManager.friendsWidget.sendFriendRequest(${user.id})">重新申请</button>`;
            default:
                return `<button class="action-btn-small btn-add-small" onclick="navbarManager.friendsWidget.sendFriendRequest(${user.id})">添加</button>`;
        }
    }

    // 发送好友申请
    async sendFriendRequest(friendId) {
        try {
            await this.makeRequest('/friends/request', 'POST', { friend_id: friendId });
            this.showMessage('好友申请发送成功', 'success');
            this.searchUsers(); // 重新搜索以更新状态
        } catch (error) {
            console.error('发送好友申请失败:', error);
            this.showMessage('发送好友申请失败', 'error');
        }
    }

    // 加载好友申请
    async loadFriendRequests() {
        try {
            const response = await this.makeRequest('/friends/requests');
            const requests = response.requests || [];
            this.renderFriendRequests(requests);
            this.updateRequestBadge(requests.length);
        } catch (error) {
            console.error('加载好友申请失败:', error);
            const container = document.getElementById('navFriendRequests');
            if (container) container.innerHTML = '<div class="empty-message">加载失败</div>';
        }
    }

    // 渲染好友申请
    renderFriendRequests(requests) {
        const container = document.getElementById('navFriendRequests');
        if (!container) return;
        
        if (!requests || requests.length === 0) {
            container.innerHTML = '<div class="empty-message">暂无好友申请</div>';
            return;
        }

        container.innerHTML = requests.slice(0, 3).map(request => `
            <div class="user-item">
                <div class="user-avatar-small">${request.username.charAt(0).toUpperCase()}</div>
                <div class="user-info-small">
                    <div class="user-name-small">${this.escapeHtml(request.username)}</div>
                    <div class="user-level-small">${this.formatDate(request.created_at)}</div>
                </div>
                <div class="user-action-small">
                    <button class="action-btn-small btn-accept-small" onclick="navbarManager.friendsWidget.respondToRequest(${request.id}, 'accept')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="action-btn-small btn-reject-small" onclick="navbarManager.friendsWidget.respondToRequest(${request.id}, 'reject')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 响应好友申请
            async respondToRequest(requestId, action) {
        try {
            await this.makeRequest('/friends/respond', 'POST', { requestId, action });
            const actionText = action === 'accept' ? '接受' : '拒绝';
            this.showMessage(`已${actionText}好友申请`, 'success');
            this.loadFriendRequests();
            if (action === 'accept') {
                this.loadFriends();
            }
        } catch (error) {
            console.error('处理好友申请失败:', error);
            this.showMessage('处理好友申请失败', 'error');
        }
    }

    // 加载好友列表
            async loadFriends() {
        try {
            const response = await this.makeRequest('/friends/list', 'GET');
            const friends = response.friends || [];
            this.renderFriends(friends);
        } catch (error) {
            console.error('加载好友列表失败:', error);
            const container = document.getElementById('navFriendsList');
            if (container) container.innerHTML = '<div class="empty-message">加载失败</div>';
        }
    }

    // 渲染好友列表
    renderFriends(friends) {
        const container = document.getElementById('navFriendsList');
        if (!container) return;
        
        if (!friends || friends.length === 0) {
            container.innerHTML = '<div class="empty-message">暂无好友</div>';
            return;
        }

        container.innerHTML = friends.slice(0, 4).map(friend => `
            <div class="user-item">
                <div class="user-avatar-small">${friend.username.charAt(0).toUpperCase()}</div>
                <div class="user-info-small">
                    <div class="user-name-small">${this.escapeHtml(friend.username)}</div>
                    <div class="user-level-small">等级: ${friend.level || 1}</div>
                </div>
                <div class="user-action-small">
                    <button class="action-btn-small btn-chat-small" onclick="navbarManager.friendsWidget.startChat(${friend.id})">
                        <i class="fas fa-comments"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 开始聊天
    startChat(friendId) {
        window.location.href = `chat.html?friend=${friendId}`;
    }

    // 更新申请数量徽章
    updateRequestBadge(count) {
        const navBadge = document.getElementById('friendRequestBadge');
        const countBadge = document.getElementById('requestCountBadge');
        
        if (count > 0) {
            const displayCount = count > 99 ? '99+' : count.toString();
            if (navBadge) {
                navBadge.textContent = displayCount;
                navBadge.style.display = 'flex';
            }
            if (countBadge) {
                countBadge.textContent = displayCount;
                countBadge.style.display = 'inline';
            }
        } else {
            if (navBadge) navBadge.style.display = 'none';
            if (countBadge) countBadge.style.display = 'none';
        }
    }

    // API请求
            async makeRequest(endpoint, method = 'GET', body = null) {
        const API_BASE_URL = 'http://localhost:3000/api';
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = { method, headers };
        if (body && method !== 'GET') {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: '请求失败' }));
            throw new Error(errorData.error || '请求失败');
        }

        // 某些接口可能返回空内容
        const contentLength = response.headers.get('content-length');
        if (contentLength === '0' || !contentLength) {
            return {};
        }

        return await response.json();
    }

    // 显示消息提示
    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `navbar-message navbar-message-${type}`;
        messageEl.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? '#238636' : type === 'error' ? '#da3633' : '#58a6ff'};
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        messageEl.textContent = message;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.style.opacity = '1';
            messageEl.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => document.body.removeChild(messageEl), 300);
        }, 2000);
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return '今天';
        if (diffDays <= 7) return `${diffDays}天前`;
        return date.toLocaleDateString('zh-CN');
    }

    // 转义HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 全局函数
function handleLogout() {
    if (confirm('确定要退出登录吗？')) {
        // 清除所有认证相关数据
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        
        // 跳转到登录页面
        window.location.href = 'auth.html';
    }
}

// 初始化导航栏
let navbarManager;
document.addEventListener('DOMContentLoaded', function() {
    navbarManager = new NavbarManager();
});

// 导出给其他页面使用
window.NavbarManager = NavbarManager;
window.navbarManager = navbarManager;
