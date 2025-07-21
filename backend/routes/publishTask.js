import { taskAPI } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    // 检查登录状态
    if (!localStorage.getItem('token')) {
        window.location.href = '/auth.html';
        return;
    }

    // 显示用户名
    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('usernameDisplay').textContent = username;
    }

    // 设置默认截止日期为3天后
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);
    document.getElementById('taskDeadline').valueAsDate = threeDaysLater;

    // 绑定事件
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = '/taskList.html';
    });

    document.getElementById('logoutBtn').addEventListener('click', logout);

    document.getElementById('cancelBtn').addEventListener('click', () => {
        if (confirm('确定要取消发布吗？所有输入的内容将丢失。')) {
            window.location.href = '/taskList.html';
        }
    });

    document.getElementById('submitBtn').addEventListener('click', handleSubmit);
});

async function handleSubmit() {
    const taskData = {
        title: document.getElementById('taskTitle').value.trim(),
        description: document.getElementById('taskDescription').value.trim(),
        reward: parseFloat(document.getElementById('taskReward').value),
        min_level: parseInt(document.getElementById('taskLevel').value),
        category: document.getElementById('taskCategory').value,
        deadline: document.getElementById('taskDeadline').value
    };

    // 验证表单
    if (!validateTask(taskData)) return;

    try {
        const result = await taskAPI.createTask(taskData);
        alert('任务发布成功！');
        window.location.href = '/taskList.html';
    } catch (error) {
        alert(error.message || '发布任务失败');
    }
}

function validateTask(task) {
    if (!task.title || task.title.length < 5 || task.title.length > 50) {
        alert('任务标题需为5-50个字符');
        return false;
    }

    if (!task.description || task.description.length < 20 || task.description.length > 500) {
        alert('任务描述需为20-500个字符');
        return false;
    }

    if (isNaN(task.reward)) {
        alert('请输入有效的悬赏金额');
        return false;
    }

    if (task.reward <= 0) {
        alert('悬赏金额必须大于0');
        return false;
    }

    if (!task.deadline) {
        alert('请选择截止日期');
        return false;
    }

    const deadlineDate = new Date(task.deadline);
    if (deadlineDate < new Date()) {
        alert('截止日期不能早于今天');
        return false;
    }

    return true;
}

function logout() {
    localStorage.clear();
    window.location.href = '/auth.html';
}