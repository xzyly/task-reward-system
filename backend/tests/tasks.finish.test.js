const request = require('supertest');
const app = require('../server');
const TestUtils = require('./helpers/testUtils');

describe('完成任务接口测试 - POST /api/tasks/:id/finish', () => {
  let publisherAuth;
  let takerAuth;
  let anotherUserAuth;

  beforeAll(async () => {
    // 清理测试数据
    TestUtils.cleanupTestData();

    // 创建测试用户
    publisherAuth = await TestUtils.createTestUser(TestUtils.generateRandomUsername('finishpub'));
    takerAuth = await TestUtils.createTestUser(TestUtils.generateRandomUsername('finishtaker'));
    anotherUserAuth = await TestUtils.createTestUser(TestUtils.generateRandomUsername('finishother'));
  });

  afterAll(async () => {
    // 清理测试数据
    TestUtils.cleanupTestData();
  });

  describe('基础功能测试', () => {
    let finishTaskId;

    beforeEach(async () => {
      // 创建任务并接单
      const testTask = await TestUtils.createTestTask(publisherAuth.authToken, {
        title: '测试完成任务_基础功能',
        description: '用于测试完成任务功能',
        reward: 400,
        min_level: 1
      });
      
      finishTaskId = testTask.id;

      // 接单
      await request(app)
        .post(`/api/tasks/${finishTaskId}/accept`)
        .send({ taker_id: takerAuth.userId })
        .expect(200);
    });

    it('应该允许接单者成功完成任务', async () => {
      const res = await request(app)
        .post(`/api/tasks/${finishTaskId}/finish`)
        .set('Authorization', `Bearer ${takerAuth.authToken}`)
        .expect(200);

      expect(res.body.message).toBe('Task finished successfully');

      // 验证任务状态已更新
      const taskRes = await request(app)
        .get(`/api/tasks/${finishTaskId}`)
        .expect(200);
      
      expect(taskRes.body.status).toBe('COMPLETED');
      expect(taskRes.body.taker_id).toBe(takerAuth.userId);
    });

    it('应该正确更新任务状态为COMPLETED', async () => {
      // 完成前检查状态
      const beforeRes = await request(app)
        .get(`/api/tasks/${finishTaskId}`)
        .expect(200);
      
      expect(beforeRes.body.status).toBe('TAKEN');

      // 完成任务
      await request(app)
        .post(`/api/tasks/${finishTaskId}/finish`)
        .set('Authorization', `Bearer ${takerAuth.authToken}`)
        .expect(200);

      // 完成后检查状态
      const afterRes = await request(app)
        .get(`/api/tasks/${finishTaskId}`)
        .expect(200);
      
      expect(afterRes.body.status).toBe('COMPLETED');
    });
  });

  describe('权限和认证测试', () => {
    let finishTaskId;

    beforeEach(async () => {
      const testTask = await TestUtils.createTestTask(publisherAuth.authToken, {
        title: '测试完成任务_权限测试',
        reward: 300
      });
      
      finishTaskId = testTask.id;

      // 接单
      await request(app)
        .post(`/api/tasks/${finishTaskId}/accept`)
        .send({ taker_id: takerAuth.userId })
        .expect(200);
    });

    it('应该拒绝未认证用户完成任务', async () => {
      const res = await request(app)
        .post(`/api/tasks/${finishTaskId}/finish`)
        .expect(401);
    });

    it('应该拒绝无效token的用户完成任务', async () => {
      const res = await request(app)
        .post(`/api/tasks/${finishTaskId}/finish`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('应该拒绝非接单者完成任务', async () => {
      const res = await request(app)
        .post(`/api/tasks/${finishTaskId}/finish`)
        .set('Authorization', `Bearer ${publisherAuth.authToken}`) // 使用发布者token
        .expect(403);

      expect(res.body.error).toBe('Only taker can finish the task');
    });

    it('应该拒绝其他用户完成任务', async () => {
      const res = await request(app)
        .post(`/api/tasks/${finishTaskId}/finish`)
        .set('Authorization', `Bearer ${anotherUserAuth.authToken}`) // 使用第三方用户token
        .expect(403);

      expect(res.body.error).toBe('Only taker can finish the task');
    });
  });

  describe('业务逻辑错误测试', () => {
    it('应该拒绝完成未接单的任务', async () => {
      // 创建一个新任务但不接单
      const testTask = await TestUtils.createTestTask(publisherAuth.authToken, {
        title: '测试完成任务_未接单任务',
        description: '用于测试未接单任务完成',
        reward: 200
      });

      const res = await request(app)
        .post(`/api/tasks/${testTask.id}/finish`)
        .set('Authorization', `Bearer ${takerAuth.authToken}`)
        .expect(400);

      expect(res.body.error).toBe('Task not in TAKEN status');
    });

    it('应该拒绝完成不存在的任务', async () => {
      const res = await request(app)
        .post('/api/tasks/99999/finish')
        .set('Authorization', `Bearer ${takerAuth.authToken}`)
        .expect(404);

      expect(res.body.error).toBe('Task not found');
    });

    it('应该拒绝完成无效ID的任务', async () => {
      const res = await request(app)
        .post('/api/tasks/invalid-id/finish')
        .set('Authorization', `Bearer ${takerAuth.authToken}`)
        .expect(404);
    });

    it('应该拒绝重复完成已完成的任务', async () => {
      // 创建任务并接单
      const testTask = await TestUtils.createTestTask(publisherAuth.authToken, {
        title: '测试完成任务_重复完成',
        reward: 500
      });

      await request(app)
        .post(`/api/tasks/${testTask.id}/accept`)
        .send({ taker_id: takerAuth.userId })
        .expect(200);

      // 第一次完成任务
      await request(app)
        .post(`/api/tasks/${testTask.id}/finish`)
        .set('Authorization', `Bearer ${takerAuth.authToken}`)
        .expect(200);

      // 第二次尝试完成应该失败
      const res = await request(app)
        .post(`/api/tasks/${testTask.id}/finish`)
        .set('Authorization', `Bearer ${takerAuth.authToken}`)
        .expect(400);

      expect(res.body.error).toBe('Task not in TAKEN status');
    });

    it('应该拒绝完成OPEN状态的任务', async () => {
      // 创建任务但不接单
      const testTask = await TestUtils.createTestTask(publisherAuth.authToken, {
        title: '测试完成任务_OPEN状态',
        reward: 250
      });

      const res = await request(app)
        .post(`/api/tasks/${testTask.id}/finish`)
        .set('Authorization', `Bearer ${takerAuth.authToken}`)
        .expect(400);

      expect(res.body.error).toBe('Task not in TAKEN status');
    });
  });

  describe('完整工作流测试', () => {
    it('应该完整测试任务的生命周期：创建->接单->完成', async () => {
      // 1. 创建任务
      const testTask = await TestUtils.createTestTask(publisherAuth.authToken, {
        title: '测试完成任务_完整工作流',
        description: '测试完整的任务生命周期',
        reward: 800,
        min_level: 1
      });

      // 验证初始状态
      let taskRes = await request(app)
        .get(`/api/tasks/${testTask.id}`)
        .expect(200);
      
      expect(taskRes.body.status).toBe('OPEN');
      expect(taskRes.body.taker_id).toBeNull();

      // 2. 接单
      await request(app)
        .post(`/api/tasks/${testTask.id}/accept`)
        .send({ taker_id: takerAuth.userId })
        .expect(200);

      // 验证接单后状态
      taskRes = await request(app)
        .get(`/api/tasks/${testTask.id}`)
        .expect(200);
      
      expect(taskRes.body.status).toBe('TAKEN');
      expect(taskRes.body.taker_id).toBe(takerAuth.userId);

      // 3. 完成任务
      await request(app)
        .post(`/api/tasks/${testTask.id}/finish`)
        .set('Authorization', `Bearer ${takerAuth.authToken}`)
        .expect(200);

      // 验证完成后状态
      taskRes = await request(app)
        .get(`/api/tasks/${testTask.id}`)
        .expect(200);
      
      expect(taskRes.body.status).toBe('COMPLETED');
      expect(taskRes.body.taker_id).toBe(takerAuth.userId);
    });

    it('应该支持同一用户完成多个任务', async () => {
      const tasks = [];
      
      // 创建多个任务
      for (let i = 0; i < 3; i++) {
        const task = await TestUtils.createTestTask(publisherAuth.authToken, {
          title: `测试完成任务_多任务${i}`,
          reward: 100 + i * 50
        });
        tasks.push(task);

        // 接单
        await request(app)
          .post(`/api/tasks/${task.id}/accept`)
          .send({ taker_id: takerAuth.userId })
          .expect(200);
      }

      // 完成所有任务
      for (const task of tasks) {
        await request(app)
          .post(`/api/tasks/${task.id}/finish`)
          .set('Authorization', `Bearer ${takerAuth.authToken}`)
          .expect(200);

        // 验证状态
        const taskRes = await request(app)
          .get(`/api/tasks/${task.id}`)
          .expect(200);
        
        expect(taskRes.body.status).toBe('COMPLETED');
      }
    });
  });

  describe('数据完整性测试', () => {
    it('完成任务后应该保持任务的其他信息不变', async () => {
      const originalTaskData = {
        title: '测试完成任务_数据完整性',
        description: '测试完成任务后数据完整性',
        reward: 600,
        min_level: 2
      };

      const testTask = await TestUtils.createTestTask(publisherAuth.authToken, originalTaskData);

      // 接单
      await request(app)
        .post(`/api/tasks/${testTask.id}/accept`)
        .send({ taker_id: takerAuth.userId })
        .expect(200);

      // 获取完成前的任务信息
      const beforeRes = await request(app)
        .get(`/api/tasks/${testTask.id}`)
        .expect(200);

      // 完成任务
      await request(app)
        .post(`/api/tasks/${testTask.id}/finish`)
        .set('Authorization', `Bearer ${takerAuth.authToken}`)
        .expect(200);

      // 获取完成后的任务信息
      const afterRes = await request(app)
        .get(`/api/tasks/${testTask.id}`)
        .expect(200);

      // 验证除了状态外，其他信息保持不变
      expect(afterRes.body.id).toBe(beforeRes.body.id);
      expect(afterRes.body.title).toBe(beforeRes.body.title);
      expect(afterRes.body.description).toBe(beforeRes.body.description);
      expect(afterRes.body.reward).toBe(beforeRes.body.reward);
      expect(afterRes.body.min_level).toBe(beforeRes.body.min_level);
      expect(afterRes.body.publisher_id).toBe(beforeRes.body.publisher_id);
      expect(afterRes.body.taker_id).toBe(beforeRes.body.taker_id);
      expect(afterRes.body.created_at).toBe(beforeRes.body.created_at);
      
      // 验证状态变化
      expect(afterRes.body.status).toBe('COMPLETED');
      expect(beforeRes.body.status).toBe('TAKEN');
    });
  });

  describe('边界情况测试', () => {
    it('应该正确处理任务状态检查的时序问题', async () => {
      // 创建任务并接单
      const testTask = await TestUtils.createTestTask(publisherAuth.authToken, {
        title: '测试完成任务_时序问题',
        reward: 300
      });

      await request(app)
        .post(`/api/tasks/${testTask.id}/accept`)
        .send({ taker_id: takerAuth.userId })
        .expect(200);

      // 模拟并发完成请求
      const promises = [
        request(app)
          .post(`/api/tasks/${testTask.id}/finish`)
          .set('Authorization', `Bearer ${takerAuth.authToken}`),
        request(app)
          .post(`/api/tasks/${testTask.id}/finish`)
          .set('Authorization', `Bearer ${takerAuth.authToken}`)
      ];

      const results = await Promise.allSettled(promises);
      
      // 应该有一个成功，一个失败
      const successCount = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      ).length;
      
      const failureCount = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 400
      ).length;
      
      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);

      // 验证最终状态
      const taskRes = await request(app)
        .get(`/api/tasks/${testTask.id}`)
        .expect(200);
      
      expect(taskRes.body.status).toBe('COMPLETED');
    });
  });
}); 