const db = require('./db');

// 示例任务数据
const sampleTasks = [
    {
        title: "设计一个现代化的Logo",
        description: "为我们的新创公司设计一个简约、现代的logo，需要包含公司名称和图标元素，提供矢量格式文件。",
        reward: 500,
        min_level: 2,
        publisher_id: 1
    },
    {
        title: "翻译技术文档",
        description: "将一份10页的英文技术文档翻译成中文，要求专业术语准确，语言流畅。涉及AI和机器学习领域。",
        reward: 300,
        min_level: 1,
        publisher_id: 1
    },
    {
        title: "网站前端优化",
        description: "优化现有网站的前端性能，包括页面加载速度优化、SEO改进、响应式设计调整等。",
        reward: 800,
        min_level: 3,
        publisher_id: 1
    },
    {
        title: "数据录入工作",
        description: "需要将纸质表格数据录入到Excel表格中，大约1000条记录，要求准确无误。",
        reward: 150,
        min_level: 1,
        publisher_id: 1
    },
    {
        title: "移动应用UI设计",
        description: "为一款社交类移动应用设计用户界面，包含主页、聊天、个人中心等页面，需要提供完整的设计稿。",
        reward: 1200,
        min_level: 2,
        publisher_id: 1
    },
    {
        title: "市场调研报告",
        description: "针对新能源汽车市场进行深度调研，分析市场趋势、竞争对手、用户需求等，形成详细报告。",
        reward: 600,
        min_level: 2,
        publisher_id: 1
    }
];

// 先插入一个用户
db.run(
    `INSERT OR IGNORE INTO user (id, username, password_hash, level) VALUES (?, ?, ?, ?)`,
    [1, 'testuser', 'dummy_hash', 1],
    function(err) {
        if (err) {
            console.error('插入用户失败:', err.message);
            return;
        }
        console.log('用户插入成功');
        
        // 插入任务数据
        db.serialize(() => {
            let inserted = 0;
            sampleTasks.forEach((task, index) => {
                db.run(
                    `INSERT INTO task (title, description, reward, min_level, status, publisher_id) VALUES (?, ?, ?, ?, ?, ?)`,
                    [task.title, task.description, task.reward, task.min_level, 'OPEN', task.publisher_id],
                    function(err) {
                        if (err) {
                            console.error(`插入任务 ${index + 1} 失败:`, err.message);
                        } else {
                            console.log(`任务 "${task.title}" 插入成功，ID: ${this.lastID}`);
                        }
                        
                        inserted++;
                        if (inserted === sampleTasks.length) {
                            console.log('所有示例数据插入完成！');
                            db.close();
                        }
                    }
                );
            });
        });
    }
); 