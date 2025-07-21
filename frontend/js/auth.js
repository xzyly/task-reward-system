import { authAPI } from './api.js';

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否已登录（有token则跳转到任务列表）
    if (localStorage.getItem('token')) {
        window.location.href = '/taskList.html';
        return;
    }

    // 绑定标签页切换事件
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // 绑定登录按钮事件
    document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
    
    // 绑定注册按钮事件
    document.getElementById('registerBtn')?.addEventListener('click', handleRegister);
});

/**
 * 切换登录/注册标签页
 * @param {string} tabName - 要切换到的标签页（'login' 或 'register'）
 */
function switchTab(tabName) {
    // 切换标签样式
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // 切换表单显示
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.toggle('active', form.id === `${tabName}Form`);
    });
}

/**
 * 处理登录请求
 */
async function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    // 前端验证
    if (!username || !password) {
        alert('用户名和密码不能为空');
        return;
    }

    try {
        // 调用API登录
        const { token, userId, username: loggedInUsername } = await authAPI.login(username, password);
        
        // 保存认证信息到本地存储
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        localStorage.setItem('username', loggedInUsername);
        
        // 跳转到任务列表页
        window.location.href = '/taskList.html';
    } catch (error) {
        console.error('登录失败:', error);
        alert(error.message || '登录失败，请检查用户名和密码');
    }
}

/**
 * 处理注册请求
 */
async function handleRegister() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirm').value;

    // 前端验证
    if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }

    if (username.length < 4 || username.length > 16) {
        alert('用户名需为4-16个字符');
        return;
    }

    if (password.length < 6) {
        alert('密码长度至少6位');
        return;
    }

    try {
        // 调用API注册
        await authAPI.register(username, password);
        alert('注册成功，请登录');
        
        // 自动切换到登录标签页
        switchTab('login');
        
        // 清空密码字段
        document.getElementById('registerPassword').value = '';
        document.getElementById('registerConfirm').value = '';
    } catch (error) {
        console.error('注册失败:', error);
        alert(error.message || '注册失败，用户名可能已被占用');
    }
}

/**
 * 退出登录（供其他页面调用）
 */
export function logout() {
    localStorage.clear();
    window.location.href = '/auth.html';
}