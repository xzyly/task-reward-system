import { messageAPI, friendAPI } from './api.js';

class ChatManager {
    constructor() {
        this.currentFriendId = null;
        this.conversations = [];
        this.messages = [];
        this.messageUpdateInterval = null;
        this.socket = null;
        this.currentUserId = null;
        this.init();
    }

    init() {
        this.currentUserId = this.getCurrentUserId();
        this.parseUrlParams();
        this.initSocket();
        this.loadConversations();
        this.setupEventListeners();
        // 不再需要轮询，使用WebSocket实时通信
        // this.startMessagePolling();
    }

    parseUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const friendId = urlParams.get('friend');
        if (friendId) {
            this.currentFriendId = parseInt(friendId);
        }
    }

    initSocket() {
        if (!this.currentUserId) {
            console.warn('用户未登录，无法初始化Socket连接');
            return;
        }

        // 连接到WebSocket服务器
        this.socket = io('http://localhost:3000');

        // 连接成功后进行身份验证
        this.socket.on('connect', () => {
            console.log('WebSocket连接成功');
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            this.socket.emit('authenticate', {
                userId: this.currentUserId,
                token: token
            });
        });

        // 监听接收到的消息
        this.socket.on('receive-message', (message) => {
            console.log('收到新消息:', message);
            this.handleNewMessage(message);
        });

        // 连接错误处理
        this.socket.on('connect_error', (error) => {
            console.error('WebSocket连接失败:', error);
        });

        // 断开连接处理
        this.socket.on('disconnect', (reason) => {
            console.log('WebSocket连接断开:', reason);
        });
    }

    setupEventListeners() {
        // 发送消息按钮
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        if (messageInput) {
            // 回车发送消息
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // 自动调整文本框高度
            messageInput.addEventListener('input', (e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            });
        }
    }

    async loadConversations() {
        const container = document.getElementById('conversationList');
        
        try {
            const response = await messageAPI.getConversations();
            this.conversations = response.conversations;
            this.renderConversations();
            
            // 如果URL中指定了好友ID，自动选择该会话
            if (this.currentFriendId) {
                this.selectConversation(this.currentFriendId);
            }
        } catch (error) {
            console.error('加载会话列表失败:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: #da3633;"></i>
                    <h4>加载失败</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    renderConversations() {
        const container = document.getElementById('conversationList');
        
        if (!this.conversations || this.conversations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h4>暂无会话</h4>
                    <p>去<a href="friends.html" style="color: #58a6ff;">好友页面</a>添加好友开始聊天吧！</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.conversations.map(conv => `
            <div class="conversation-item ${conv.friend_id === this.currentFriendId ? 'active' : ''}" 
                 onclick="chatManager.selectConversation(${conv.friend_id})">
                <div class="conversation-user">
                    <div class="conversation-avatar">${conv.friend_username.charAt(0).toUpperCase()}</div>
                    ${this.escapeHtml(conv.friend_username)}
                </div>
                <div class="conversation-preview">
                    ${conv.is_sent_by_me ? '我: ' : ''}${this.escapeHtml(conv.last_message)}
                </div>
                <div class="conversation-time">${this.formatTime(conv.last_message_time)}</div>
                ${conv.unread_count > 0 ? `<div class="unread-badge">${conv.unread_count}</div>` : ''}
            </div>
        `).join('');
    }

    async selectConversation(friendId) {
        this.currentFriendId = friendId;
        
        // 更新会话列表中的选中状态
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.conversation-item[onclick*="${friendId}"]`)?.classList.add('active');
        
        // 更新URL
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('friend', friendId);
        window.history.replaceState({}, '', newUrl);
        
        // 加入WebSocket房间
        if (this.socket && this.currentUserId) {
            const roomId = [this.currentUserId, friendId].sort().join('-');
            this.socket.emit('join-room', roomId);
            console.log('加入聊天房间:', roomId);
        }
        
        // 加载聊天界面
        await this.loadChatInterface(friendId);
        
        // 加载消息历史
        await this.loadMessages(friendId);
    }

    async loadChatInterface(friendId) {
        const chatContent = document.getElementById('chatContent');
        
        // 从会话列表中获取好友信息
        const conversation = this.conversations.find(c => c.friend_id === friendId);
        const friendName = conversation ? conversation.friend_username : '好友';
        
        chatContent.innerHTML = `
            <div class="chat-header">
                <div class="chat-header-avatar">${friendName.charAt(0).toUpperCase()}</div>
                <div class="chat-header-info">
                    <h3>${this.escapeHtml(friendName)}</h3>
                    <p>在线</p>
                </div>
            </div>
            <div class="chat-messages" id="chatMessages">
                <div class="loading">
                    <i class="fas fa-spinner"></i>
                    加载消息中...
                </div>
            </div>
            <div class="chat-input">
                <div class="input-group">
                    <textarea id="messageInput" class="message-input" placeholder="输入消息..." rows="1"></textarea>
                    <button id="sendBtn" class="send-btn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        
        // 重新绑定事件监听器
        this.setupEventListeners();
    }

    async loadMessages(friendId, page = 1) {
        const messagesContainer = document.getElementById('chatMessages');
        
        try {
            const response = await messageAPI.getHistory(friendId, page);
            this.messages = response.messages;
            this.renderMessages();
            
            // 滚动到底部（最新消息）
            this.scrollToBottom();
        } catch (error) {
            console.error('加载消息失败:', error);
            messagesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: #da3633;"></i>
                    <h4>加载失败</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    renderMessages() {
        const container = document.getElementById('chatMessages');
        
        if (!this.messages || this.messages.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h4>暂无消息</h4>
                    <p>发送第一条消息开始聊天吧！</p>
                </div>
            `;
            return;
        }

        const currentUserId = this.getCurrentUserId();
        
        container.innerHTML = this.messages.map(message => {
            const isSent = message.sender_id === currentUserId;
            return `
                <div class="message ${isSent ? 'sent' : 'received'}">
                    <div class="message-content">${this.escapeHtml(message.content)}</div>
                    <div class="message-time">${this.formatTime(message.created_at)}</div>
                </div>
            `;
        }).join('');
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        
        if (!this.currentFriendId) {
            this.showMessage('请先选择一个好友', 'error');
            return;
        }
        
        const content = messageInput.value.trim();
        if (!content) {
            return;
        }
        
        // 禁用发送按钮和输入框
        sendBtn.disabled = true;
        messageInput.disabled = true;
        
        try {
            const response = await messageAPI.sendMessage(this.currentFriendId, content);
            
            // 清空输入框
            messageInput.value = '';
            messageInput.style.height = 'auto';
            
            // WebSocket会实时更新消息，所以不需要重新加载
            // 只需要更新会话列表
            await this.loadConversations();
            
        } catch (error) {
            console.error('发送消息失败:', error);
            this.showMessage('发送消息失败: ' + error.message, 'error');
        } finally {
            // 重新启用发送按钮和输入框
            sendBtn.disabled = false;
            messageInput.disabled = false;
            messageInput.focus();
        }
    }

    handleNewMessage(message) {
        // 检查消息是否属于当前会话
        if (this.currentFriendId && 
            (message.sender_id === this.currentFriendId || message.receiver_id === this.currentFriendId)) {
            
            // 将新消息添加到消息列表
            this.messages.push(message);
            
            // 重新渲染消息
            this.renderMessages();
            
            // 滚动到底部
            this.scrollToBottom();
        }
        
        // 更新会话列表（显示最新消息）
        this.loadConversations();
    }

    startMessagePolling() {
        // 每5秒轮询一次新消息
        this.messageUpdateInterval = setInterval(() => {
            if (this.currentFriendId) {
                this.loadMessages(this.currentFriendId);
            }
            this.loadConversations();
        }, 5000);
    }

    stopMessagePolling() {
        if (this.messageUpdateInterval) {
            clearInterval(this.messageUpdateInterval);
            this.messageUpdateInterval = null;
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    getCurrentUserId() {
        // 从localStorage获取当前用户ID
        const userData = localStorage.getItem('userData');
        const userId = localStorage.getItem('userId');
        
        if (userData) {
            try {
                const user = JSON.parse(userData);
                return user.id || user.user_id;
            } catch (e) {
                console.warn('解析用户数据失败:', e);
            }
        }
        
        return userId ? parseInt(userId) : null;
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // 今天，显示时间
            return date.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else if (diffDays === 1) {
            // 昨天
            return '昨天 ' + date.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else if (diffDays < 7) {
            // 一周内
            const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            return weekdays[date.getDay()];
        } else {
            // 更早
            return date.toLocaleDateString('zh-CN', { 
                month: 'short', 
                day: 'numeric' 
            });
        }
    }

    showMessage(message, type = 'info') {
        // 创建消息提示
        const messageEl = document.createElement('div');
        messageEl.className = `message-toast message-${type}`;
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
                if (document.body.contains(messageEl)) {
                    document.body.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    destroy() {
        this.stopMessagePolling();
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

// 初始化聊天管理器
const chatManager = new ChatManager();

// 导出到全局作用域供HTML调用
window.chatManager = chatManager;

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    chatManager.destroy();
});
