import { authAPI } from './api.js';
import { MessageSystem, AuthManager, NavigationManager, FormValidator } from './utils.js';

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 设置页面标题
    NavigationManager.setPageTitle('登录注册');
    
    // 检查是否已登录（有token则跳转到任务列表）
    if (AuthManager.isLoggedIn()) {
        NavigationManager.navigateTo('taskList.html');
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

    try {
        // 前端验证
        FormValidator.validateRequired(username, '用户名');
        FormValidator.validateRequired(password, '密码');

        // 调用API登录
        const result = await authAPI.login(username, password);
        
        // 保存认证信息
        AuthManager.saveAuth({
            token: result.token,
            userId: result.userId,
            username: result.username || username,
            user: result.user
        });
        
        MessageSystem.success('登录成功！');
        
        // 跳转到任务列表页
        setTimeout(() => {
            NavigationManager.navigateTo('taskList.html');
        }, 1000);
    } catch (error) {
        console.error('登录失败:', error);
        MessageSystem.error(error.message || '登录失败，请检查用户名和密码');
    }
}

/**
 * 处理注册请求
 */
async function handleRegister() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirm').value;

    try {
        // 前端验证
        FormValidator.validateRequired(username, '用户名');
        FormValidator.validateRequired(password, '密码');
        FormValidator.validateRequired(confirmPassword, '确认密码');
        FormValidator.validateLength(username, 4, 16, '用户名');
        FormValidator.validatePassword(password);

        if (password !== confirmPassword) {
            throw new Error('两次输入的密码不一致');
        }

        // 调用API注册
        await authAPI.register(username, password);
        
        MessageSystem.success('注册成功！请登录');
        
        // 切换到登录表单
        switchTab('login');
        
        // 预填用户名
        document.getElementById('loginUsername').value = username;
        
        // 清空密码字段
        document.getElementById('registerPassword').value = '';
        document.getElementById('registerConfirm').value = '';
    } catch (error) {
        console.error('注册失败:', error);
        MessageSystem.error(error.message || '注册失败，请稍后重试');
    }
}

/**
 * 退出登录（供其他页面调用）
 */
export function logout() {
    AuthManager.logout();
}
