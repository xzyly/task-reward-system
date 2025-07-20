const request = require('supertest');
const app = require('../server');
const db = require('../db');
const TestUtils = require('./helpers/testUtils');

describe('任务列表接口测试 - GET /api/tasks', () => {
  let publisherAuth;
  let testTaskId;

  beforeAll(async () => {
    // 清理测试数据
    TestUtils.cleanupTestData();

    // 创建发布者用户
    const username = TestUtils.generateRandomUsername('listpub');
    publisherAuth = await TestUtils.createTestUser(username);

    // 创建测试任务
    const testTask = await TestUtils.createTestTask(publisherAuth.authToken, {
      title: '测试任务列表_任务1',
      description: '用于测试任务列表接口的任务',
      reward: 300
    });
    testTaskId = testTask.id;
  });

  afterAll(async () => {
    // 清理测试数据
    TestUtils.cleanupTestData();
  });

  describe('基础功能测试', () => {
    it('应该成功获取所有任务列表', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('应该返回正确的任务数据结构', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .expect(200);

      const task = res.body[0];
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('description');
      expect(task).toHaveProperty('reward');
      expect(task).toHaveProperty('status');
      expect(task).toHaveProperty('publisher_id');
      expect(task).toHaveProperty('created_at');
    });

    it('应该包含刚创建的测试任务', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .expect(200);

      const testTask = res.body.find(task => task.id === testTaskId);
      expect(testTask).toBeDefined();
      expect(testTask.title).toBe('测试任务列表_任务1');
      expect(testTask.reward).toBe(300);
      expect(testTask.status).toBe('OPEN');
      expect(testTask.publisher_id).toBe(publisherAuth.userId);
    });
  });

  describe('权限测试', () => {
    it('即使未认证也应该能获取任务列表', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('认证用户也应该能正常获取任务列表', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${publisherAuth.authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('数据完整性测试', () => {
    it('应该返回所有状态的任务', async () => {
      // 创建不同状态的任务进行测试
      const takerId = (await TestUtils.createTestUser(TestUtils.generateRandomUsername('taker'))).userId;
      
      // 创建一个任务并接单
      const takenTask = await TestUtils.createTestTask(publisherAuth.authToken, {
        title: '测试任务列表_已接单任务',
        reward: 400
      });

      // 接单
      await request(app)
        .post(`/api/tasks/${takenTask.id}/accept`)
        .send({ taker_id: takerId });

      // 获取任务列表
      const res = await request(app)
        .get('/api/tasks')
        .expect(200);

      const openTasks = res.body.filter(task => task.status === 'OPEN');
      const takenTasks = res.body.filter(task => task.status === 'TAKEN');

      expect(openTasks.length).toBeGreaterThan(0);
      expect(takenTasks.length).toBeGreaterThan(0);
    });

    it('应该按正确格式返回时间字段', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .expect(200);

      const task = res.body[0];
      expect(task.created_at).toBeDefined();
      expect(new Date(task.created_at)).toBeInstanceOf(Date);
      expect(isNaN(new Date(task.created_at).getTime())).toBe(false);
    });

    it('应该返回正确的数据类型', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .expect(200);

      const task = res.body[0];
      expect(typeof task.id).toBe('number');
      expect(typeof task.title).toBe('string');
      expect(typeof task.description).toBe('string');
      expect(typeof task.reward).toBe('number');
      expect(typeof task.status).toBe('string');
      expect(typeof task.publisher_id).toBe('number');
      expect(typeof task.created_at).toBe('string');
    });
  });

  describe('性能和边界测试', () => {
    it('应该能处理大量任务的查询', async () => {
      // 创建多个任务
      const taskPromises = [];
      for (let i = 0; i < 5; i++) {
        taskPromises.push(
          TestUtils.createTestTask(publisherAuth.authToken, {
            title: `批量测试任务_${i}`,
            reward: 100 + i * 10
          })
        );
      }
      await Promise.all(taskPromises);

      const startTime = Date.now();
      const res = await request(app)
        .get('/api/tasks')
        .expect(200);
      const endTime = Date.now();

      expect(res.body.length).toBeGreaterThanOrEqual(5);
      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('即使没有任务也应该返回空数组', async () => {
      // 临时清理所有任务
      try {
        db.prepare('DELETE FROM task').run();
      } catch (error) {
        // 忽略清理错误
      }

      const res = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);

      // 重新创建测试任务
      await TestUtils.createTestTask(publisherAuth.authToken, {
        title: '测试任务列表_恢复任务',
        reward: 200
      });
    });
  });
}); 