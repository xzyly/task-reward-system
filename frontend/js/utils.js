/**
 * 通用工具函数库
 */

// 消息提示系统
export class MessageSystem {
    static show(message, type = 'info', duration = 3000) {
        // 移除已存在的消息
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas ${this.getIcon(type)}"></i>
                <span>${this.escapeHtml(message)}</span>
            </div>
        `;

        // 添加到页面
        document.body.appendChild(messageEl);

        // 自动移除
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => {
                    messageEl.remove();
                }, 300);
            }
        }, duration);
    }

    static success(message, duration = 3000) {
        this.show(message, 'success', duration);
    }

    static error(message, duration = 5000) {
        this.show(message, 'error', duration);
    }

    static warning(message, duration = 4000) {
        this.show(message, 'warning', duration);
    }

    static info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }

    static getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-triangle',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 添加slideOut动画
if (!document.querySelector('#message-styles')) {
    const style = document.createElement('style');
    style.id = 'message-styles';
    style.textContent = `
        @keyframes slideOut {
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// 认证管理系统
export class AuthManager {
    // 检查是否已登录
    static isLoggedIn() {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        return !!token;
    }

    // 获取当前用户信息
    static getCurrentUser() {
        const userData = localStorage.getItem('userData');
        const username = localStorage.getItem('username');
        
        if (userData) {
            try {
                return JSON.parse(userData);
            } catch (e) {
                console.warn('解析用户数据失败:', e);
            }
        }
        
        if (username) {
            return { username };
        }
        
        return null;
    }

    // 获取认证token
    static getToken() {
        return localStorage.getItem('authToken') || localStorage.getItem('token');
    }

    // 保存登录信息
    static saveAuth(authData) {
        if (authData.token) {
            localStorage.setItem('authToken', authData.token);
            localStorage.setItem('token', authData.token); // 兼容旧版本
        }
        if (authData.user) {
            localStorage.setItem('userData', JSON.stringify(authData.user));
        }
        if (authData.username) {
            localStorage.setItem('username', authData.username);
        }
        if (authData.userId) {
            localStorage.setItem('userId', authData.userId);
        }
    }

    // 清除登录信息
    static clearAuth() {
        const keysToRemove = [
            'authToken', 'token', 'userData', 
            'username', 'userId'
        ];
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
    }

    // 检查页面访问权限
    static requireAuth(redirectUrl = 'auth.html') {
        if (!this.isLoggedIn()) {
            MessageSystem.warning('请先登录后再访问此页面');
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1000);
            return false;
        }
        return true;
    }

    // 登出
    static logout() {
        this.clearAuth();
        MessageSystem.success('已成功退出登录');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1000);
    }
}

// 页面导航管理
export class NavigationManager {
    // 页面跳转
    static navigateTo(url, params = {}) {
        const urlParams = new URLSearchParams(params);
        const fullUrl = urlParams.toString() ? `${url}?${urlParams.toString()}` : url;
        window.location.href = fullUrl;
    }

    // 获取URL参数
    static getUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const params = {};
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        return params;
    }

    // 获取单个URL参数
    static getUrlParam(name, defaultValue = null) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name) || defaultValue;
    }

    // 设置页面标题
    static setPageTitle(title) {
        document.title = `${title} - 任务悬赏平台`;
    }

    // 返回上一页
    static goBack() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            this.navigateTo('taskList.html');
        }
    }
}

// 加载状态管理
export class LoadingManager {
    static show(element = null, text = '加载中...') {
        if (element) {
            element.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>${text}</p>
                </div>
            `;
        } else {
            // 全屏加载
            const loadingEl = document.createElement('div');
            loadingEl.id = 'global-loading';
            loadingEl.className = 'loading';
            loadingEl.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(13, 17, 23, 0.8);
                backdrop-filter: blur(10px);
                z-index: 9999;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            `;
            loadingEl.innerHTML = `
                <div class="spinner"></div>
                <p style="margin-top: 16px; color: #8b949e;">${text}</p>
            `;
            document.body.appendChild(loadingEl);
        }
    }

    static hide(element = null) {
        if (element) {
            element.innerHTML = '';
        } else {
            const loadingEl = document.getElementById('global-loading');
            if (loadingEl) {
                loadingEl.remove();
            }
        }
    }
}

// 表单验证工具
export class FormValidator {
    static validateRequired(value, fieldName) {
        if (!value || value.trim() === '') {
            throw new Error(`${fieldName}不能为空`);
        }
        return true;
    }

    static validateLength(value, min, max, fieldName) {
        if (value.length < min || value.length > max) {
            throw new Error(`${fieldName}长度应在${min}-${max}个字符之间`);
        }
        return true;
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('请输入有效的邮箱地址');
        }
        return true;
    }

    static validateNumber(value, fieldName, min = null, max = null) {
        const num = parseFloat(value);
        if (isNaN(num)) {
            throw new Error(`${fieldName}必须是有效数字`);
        }
        if (min !== null && num < min) {
            throw new Error(`${fieldName}不能小于${min}`);
        }
        if (max !== null && num > max) {
            throw new Error(`${fieldName}不能大于${max}`);
        }
        return true;
    }

    static validatePassword(password) {
        if (password.length < 6) {
            throw new Error('密码至少需要6个字符');
        }
        return true;
    }
}

// 格式化工具
export class FormatUtils {
    // 格式化时间
    static formatTime(timeStr) {
        const date = new Date(timeStr);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        if (hours < 1) return '刚刚';
        if (hours < 24) return `${hours}小时前`;
        
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}天前`;
        if (days < 30) return `${Math.floor(days / 7)}周前`;
        if (days < 365) return `${Math.floor(days / 30)}个月前`;
        
        return date.toLocaleDateString();
    }

    // 格式化金额
    static formatMoney(amount) {
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY'
        }).format(amount);
    }

    // 截断文本
    static truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // HTML转义
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 防抖函数
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
export function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function(...args) {
        if (!lastRan) {
            func.apply(this, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(() => {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(this, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}

// 导航栏集成函数
export function loadNavbar() {
    return fetch('navbar.html')
        .then(response => response.text())
        .then(html => {
            // 解析HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const navbar = doc.querySelector('.navbar');
            
            if (navbar) {
                // 插入到页面开头
                document.body.insertBefore(navbar, document.body.firstChild);
                
                // 执行导航栏的脚本
                const scripts = doc.querySelectorAll('script');
                scripts.forEach(script => {
                    const newScript = document.createElement('script');
                    newScript.textContent = script.textContent;
                    document.body.appendChild(newScript);
                });
                
                return true;
            }
            return false;
        })
        .catch(error => {
            console.error('加载导航栏失败:', error);
            return false;
        });
}

// 全局错误处理
window.addEventListener('error', function(e) {
    console.error('全局错误:', e.error);
    MessageSystem.error('页面发生错误，请刷新页面重试');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('未处理的Promise错误:', e.reason);
    MessageSystem.error('网络请求失败，请检查网络连接');
});

// 导出默认对象
export default {
    MessageSystem,
    AuthManager,
    NavigationManager,
    LoadingManager,
    FormValidator,
    FormatUtils,
    debounce,
    throttle,
    loadNavbar
}; 