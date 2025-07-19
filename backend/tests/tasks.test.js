const request = require('supertest');
const app = require('../server');
const db = require('../db');

describe('任务系统', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // 注册测试用户并获取token
    await request(app)
      .post('/api/register')
      .send({ username: 'taskuser', password: 'taskpass' });
    
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'taskuser', password: 'taskpass' });
    
    authToken = loginRes.body.token;
    userId = loginRes.body.userId;
  });

  it('应该允许认证用户创建任务', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: '测试任务',
        description: '这是一个测试任务',
        reward: 100
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('测试任务');
  });

  it('应该拒绝未认证用户创建任务', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({
        title: '未认证任务',
        description: '这个应该失败',
        reward: 100
      });
    
    expect(res.statusCode).toEqual(401);
  });
});