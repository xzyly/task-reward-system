const request = require('supertest');
const app = require('../../server');
const db = require('../../db');

/**
 * 测试工具类
 */
class TestUtils {
  /**
   * 清理测试数据
   */
  static cleanupTestData() {
    try {
      db.prepare('DELETE FROM task WHERE title LIKE ?').run('%测试%');
      db.prepare('DELETE FROM user WHERE username LIKE ?').run('%testuser%');
    } catch (error) {
      // 忽略清理错误
    }
  }

  /**
   * 创建测试用户并登录
   * @param {string} username 用户名
   * @param {string} password 密码
   * @returns {Object} { userId, authToken }
   */
  static async createTestUser(username = 'testuser', password = 'testpass123') {
    // 注册用户
    const registerRes = await request(app)
      .post('/api/register')
      .send({ username, password });
    
    // 登录获取token
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username, password });
    
    if (!loginRes.body.token) {
      throw new Error(`登录失败: ${JSON.stringify(loginRes.body)}`);
    }
    
    return {
      userId: loginRes.body.userId,
      authToken: loginRes.body.token
    };
  }

  /**
   * 创建测试任务
   * @param {string} authToken 认证token
   * @param {Object} taskData 任务数据
   * @returns {Object} 创建的任务信息
   */
  static async createTestTask(authToken, taskData = {}) {
    const defaultTaskData = {
      title: '测试任务标题',
      description: '这是一个用于测试的任务描述',
      reward: 500,
      min_level: 1,
      ...taskData
    };

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send(defaultTaskData);
    
    if (!res.body.task) {
      throw new Error(`创建任务失败: ${res.status} - ${JSON.stringify(res.body)}`);
    }
    
    return res.body.task;
  }

  /**
   * 生成随机用户名
   * @param {string} prefix 前缀
   * @returns {string} 随机用户名
   */
  static generateRandomUsername(prefix = 'testuser') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }
}

module.exports = TestUtils; 