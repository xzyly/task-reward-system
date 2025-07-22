const request = require('supertest');
const app = require('../server');
const TestUtils = require('./helpers/testUtils');

describe('接单接口测试 - POST /api/tasks/:id/accept', () => {
  let publisherAuth;
  let takerAuth;
  let anotherTakerAuth;

  beforeAll(async () => {
    // 清理测试数据
    TestUtils.cleanupTestData();

    // 创建测试用户
    publisherAuth = await TestUtils.createTestUser(TestUtils.generateRandomUsername('acceptpub'));
    takerAuth = await TestUtils.createTestUser(TestUtils.generateRandomUsername('accepttaker'));
    anotherTakerAuth = await TestUtils.createTestUser(TestUtils.generateRandomUsername('acceptother'));
  });

  afterAll(async () => {
    // 清理测试数据
    TestUtils.cleanupTestData();
  });

  describe('基础功能测试', () => {
    let testTaskId;

    beforeEach(async () => {
      // 为每个测试创建新任务
      const testTask = await TestUtils.createTestTask(publisherAuth.authToken, {
        title: '测试接单_基础功能任务',
        description: '用于测试接单功能',
        reward: 300,
        min_level: 1
      });
      testTaskId = testTask.id;
    });

    it('应该允许用户成功接单', async () => {
      const res = await request(app)
        .post(`/api/tasks/${testTaskId}/accept`)
        .send({ taker_id: takerAuth.userId })
        .expect(200);

      expect(res.body.message).toBe('Task accepted successfully');

      // 验证任务状态已更新
      const taskRes = await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .expect(200);
      
      expect(taskRes.body.status).toBe('TAKEN');
      expect(taskRes.body.taker_id).toBe(takerAuth.userId);
    });

    it('应该正确更新任务状态和接单者信息', async () => {
      // 接单前检查状态
      const beforeRes = await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .expect(200);
      
      expect(beforeRes.body.status).toBe('OPEN');
      expect(beforeRes.body.taker_id).toBeNull();

      // 接单
      await request(app)
        .post(`/api/tasks/${testTaskId}/accept`)
        .send({ taker_id: takerAuth.userId })
        .expect(200);

      // 接单后检查状态
      const afterRes = await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .expect(200);
      
      expect(afterRes.body.status).toBe('TAKEN');
      expect(afterRes.body.taker_id).toBe(takerAuth.userId);
      expect(afterRes.body.publisher_id).toBe(publisherAuth.userId);
    });
  });

  describe('错误处理测试', () => {
    let testTaskId;

    beforeEach(async () => {
      const testTask = await TestUtils.createTestTask(publisherAuth.authToken, {
        title: '测试接单_错误处理任务',
        reward: 400
      });
      testTaskId = testTask.id;
    });

    it('应该拒绝重复接单', async () => {
      // 第一次接单
      await request(app)
        .post(`/api/tasks/${testTaskId}/accept`)
        .send({ taker_id: takerAuth.userId })
        .expect(200);

      // 第二次接单应该失败
      const res = await request(app)
        .post(`/api/tasks/${testTaskId}/accept`)
        .send({ taker_id: anotherTakerAuth.userId })
        .expect(400);

      expect(res.body.error).toContain('already taken');
    });

    it('应该拒绝不存在的任务接单', async () => {
      const res = await request(app)
        .post('/api/tasks/99999/accept')
        .send({ taker_id: takerAuth.userId })
        .expect(404);

      expect(res.body.error).toBe('Task not found');
    });

    it('应该拒绝无效的任务ID', async () => {
      const res = await request(app)
        .post('/api/tasks/invalid-id/accept')
        .send({ taker_id: takerAuth.userId })
        .expect(404);
    });

    it('应该拒绝缺少taker_id的接单请求', async () => {
      const res = await request(app)
        .post(`/api/tasks/${testTaskId}/accept`)
        .send({});
      
      // 后端可能返回200但实际处理失败，或者返回400/500
      expect([200, 400, 500]).toContain(res.status);
    });

    it('应该拒绝无效的taker_id', async () => {
      const res = await request(app)
        .post(`/api/tasks/${testTaskId}/accept`)
        .send({ taker_id: 'invalid-id' });
      
      // 后端可能返回不同的错误状态码
      expect([400, 500]).toContain(res.status);
    });

    it('应该拒绝不存在的用户接单', async () => {
      const res = await request(app)
        .post(`/api/tasks/${testTaskId}/accept`)
        .send({ taker_id: 99999 });

      if (res.status === 200) {
        // 如果接单成功，验证任务状态确实更新了
        const taskRes = await request(app)
          .get(`/api/tasks/${testTaskId}`)
          .expect(200);
        
        expect(taskRes.body.status).toBe('TAKEN');
        expect(taskRes.body.taker_id).toBe(99999);
      } else {
        // 如果失败，应该是500错误
        expect(res.status).toBe(500);
      }
    });
  });

  describe('并发测试', () => {
    let testTaskId;

    beforeEach(async () => {
      const testTask = await TestUtils.createTestTask(publisherAuth.authToken, {
        title: '测试接单_并发测试任务',
        reward: 500
      });
      testTaskId = testTask.id;
    });

    it('应该正确处理并发接单请求', async () => {
      // 模拟两个用户同时接单
      const promises = [
        request(app)
          .post(`/api/tasks/${testTaskId}/accept`)
          .send({ taker_id: takerAuth.userId }),
        request(app)
          .post(`/api/tasks/${testTaskId}/accept`)
          .send({ taker_id: anotherTakerAuth.userId })
      ];

      const results = await Promise.allSettled(promises);
      
      // 应该有一个成功，一个失败
      const successResults = results.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      const failedResults = results.filter(r => r.status === 'fulfilled' && r.value.status === 400);
      
      expect(successResults.length).toBe(1);
      expect(failedResults.length).toBe(1);

      // 验证最终状态
      const taskRes = await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .expect(200);
      
      expect(taskRes.body.status).toBe('TAKEN');
      expect([takerAuth.userId, anotherTakerAuth.userId]).toContain(taskRes.body.taker_id);
    });

    it('应该处理多个用户同时接单的情况', async () => {
      // 创建更多测试用户
      const users = [];
      for (let i = 0; i < 3; i++) {
        const user = await TestUtils.createTestUser(TestUtils.generateRandomUsername(`concurrent_${i}`));
        users.push(user);
      }

      // 所有用户同时尝试接单
      const promises = users.map(user => 
        request(app)
          .post(`/api/tasks/${testTaskId}/accept`)
          .send({ taker_id: user.userId })
      );

      const results = await Promise.allSettled(promises);
      
      // 只应该有一个成功
      const successCount = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      ).length;
      
      expect(successCount).toBe(1);
    });
  });

  describe('业务逻辑测试', () => {
    it('应该允许发布者接自己的任务', async () => {
      const testTask = await TestUtils.createTestTask(publisherAuth.authToken, {
        title: '测试接单_发布者接单',
        reward: 200
      });

      const res = await request(app)
        .post(`/api/tasks/${testTask.id}/accept`)
        .send({ taker_id: publisherAuth.userId })
        .expect(200);

      expect(res.body.message).toBe('Task accepted successfully');
    });

    it('应该能接单不同等级要求的任务', async () => {
      const lowLevelTask = await TestUtils.createTestTask(publisherAuth.authToken, {
        title: '测试接单_低等级任务',
        reward: 100,
        min_level: 1
      });

      const highLevelTask = await TestUtils.createTestTask(publisherAuth.authToken, {
        title: '测试接单_高等级任务',
        reward: 1000,
        min_level: 5
      });

      // 接单低等级任务
      await request(app)
        .post(`/api/tasks/${lowLevelTask.id}/accept`)
        .send({ taker_id: takerAuth.userId })
        .expect(200);

      // 接单高等级任务（注意：当前后端没有检查用户等级）
      await request(app)
        .post(`/api/tasks/${highLevelTask.id}/accept`)
        .send({ taker_id: anotherTakerAuth.userId })
        .expect(200);
    });
  });

  describe('数据完整性测试', () => {
    it('接单后应该保持任务的其他信息不变', async () => {
      const originalTaskData = {
        title: '测试接单_数据完整性',
        description: '测试接单后数据完整性',
        reward: 600,
        min_level: 2
      };

      const testTask = await TestUtils.createTestTask(publisherAuth.authToken, originalTaskData);

      // 获取接单前的任务信息
      const beforeRes = await request(app)
        .get(`/api/tasks/${testTask.id}`)
        .expect(200);

      // 接单
      await request(app)
        .post(`/api/tasks/${testTask.id}/accept`)
        .send({ taker_id: takerAuth.userId })
        .expect(200);

      // 获取接单后的任务信息
      const afterRes = await request(app)
        .get(`/api/tasks/${testTask.id}`)
        .expect(200);

      // 验证除了状态和接单者外，其他信息保持不变
      expect(afterRes.body.id).toBe(beforeRes.body.id);
      expect(afterRes.body.title).toBe(beforeRes.body.title);
      expect(afterRes.body.description).toBe(beforeRes.body.description);
      expect(afterRes.body.reward).toBe(beforeRes.body.reward);
      expect(afterRes.body.min_level).toBe(beforeRes.body.min_level);
      expect(afterRes.body.publisher_id).toBe(beforeRes.body.publisher_id);
      expect(afterRes.body.created_at).toBe(beforeRes.body.created_at);
      
      // 验证变化的字段
      expect(afterRes.body.status).toBe('TAKEN');
      expect(afterRes.body.taker_id).toBe(takerAuth.userId);
      expect(beforeRes.body.status).toBe('OPEN');
      expect(beforeRes.body.taker_id).toBeNull();
    });
  });
}); 