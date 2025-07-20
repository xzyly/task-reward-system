const request = require('supertest');
const app = require('../server');
const db = require('../db');

describe('认证系统', () => {
  beforeAll(() => {
    // 初始化测试数据库
    try {
      db.prepare('DELETE FROM user WHERE username LIKE ?').run('%testuser%');
    } catch (error) {
      // 忽略清理错误
    }
  });

  it('应该允许用户注册', async () => {
    const username = `authuser_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const res = await request(app)
      .post('/api/register')
      .send({ username, password: 'testpass' });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.username).toBe(username);
  });

  it('应该拒绝重复用户名注册', async () => {
    const username = `dupuser_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // 先注册一次
    await request(app)
      .post('/api/register')
      .send({ username, password: 'testpass' });
    
    // 再次注册相同用户名应该失败
    const res = await request(app)
      .post('/api/register')
      .send({ username, password: 'testpass' });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBe('用户名已存在');
  });

  it('应该允许用户登录并返回token', async () => {
    const username = `loginuser_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // 先注册用户
    await request(app)
      .post('/api/register')
      .send({ username, password: 'testpass' });
    
    // 然后登录
    const res = await request(app)
      .post('/api/login')
      .send({ username, password: 'testpass' });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.token).toBeTruthy();
  });
});

























































