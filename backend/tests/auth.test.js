const request = require('supertest');
const app = require('../server');
const db = require('../db');

describe('认证系统', () => {
  beforeAll(async () => {
    // 初始化测试数据库
    await new Promise((resolve) => {
      db.run('DELETE FROM user', [], () => resolve());
    });
  });

  it('应该允许用户注册', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'testuser', password: 'testpass' });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.username).toBe('testuser');
  });

  it('应该拒绝重复用户名注册', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'testuser', password: 'testpass' });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBe('用户名已存在');
  });

  it('应该允许用户登录并返回token', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'testuser', password: 'testpass' });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.token).toBeTruthy();
  });
});

























































