const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

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
    apis:['./routes/*.js'],//指定包含注释的文件路径
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
















