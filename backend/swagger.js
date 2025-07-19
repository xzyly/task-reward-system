const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title:'任务悬赏系统API',
            version:'1.0.0',
            description:'一个简单的任务悬赏系统API文档',
        },
        components:{
            securitySchemes:{
                bearerAuth:{
                    type:'http',
                    scheme:'bearer',
                    bearerFormat:'JWT',
                }
            }
        },
        security:[{
            bearerAuth:[]
        }]
    },
    apis:[path.join(__dirname, 'routes', '*.js')], // 使用绝对路径
};

const swaggerSpec = swaggerJSDoc(options);

function setupSwagger(app) { 
    app.use('/api-docs',swaggerUi.serve,swaggerUi.setup(swaggerSpec));
    app.get('/api-docs.json',(req,res) => {
        res.setHeader('Content-Type','application/json');
        res.send(swaggerSpec);
    });
}

module.exports = setupSwagger;
















