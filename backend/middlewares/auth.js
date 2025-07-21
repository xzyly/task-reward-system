// 创建认证中间件 
const jwt = require('jsonwebtoken');
const db = require('../db');

const authenticate = (req,res,next) => {
    const token = req.header('Authorization')?.replace('Bearer ','');
    if(!token) return res.status(401).json({error:'请提供认证令牌'});
    
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.userId;
        next();
    }catch(err){
        res.status(401).json({error:'无效的认证令牌'});
    }
};

module.exports = {authenticate};



 











