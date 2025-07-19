module.exports = {
    app:[{
        name:'taskk-reward-system',
        script:'server.js',
        instances:'max',
        autorestart:true,
        watch:false,
        max_memory_restart:'1G',
        env:{
            NODE_ENV:'production',
            JWT_SECRET:'your-production-secret',
            PORT:3000
        }
    }]
};




















