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

console.log('开始插入示例数据...');

try {
    // 先插入一个用户（如果不存在）
    const insertUser = db.prepare(`INSERT OR IGNORE INTO user (id, username, password_hash, level) VALUES (?, ?, ?, ?)`);
    insertUser.run(1, 'demo_user', 'dummy_hash', 1);
    console.log('✅ 用户插入成功');
    
    // 清理现有的示例任务
    const deleteOldTasks = db.prepare(`DELETE FROM task WHERE publisher_id = 1`);
    deleteOldTasks.run();
    console.log('🧹 清理旧数据完成');
    
    // 插入示例任务
    const insertTask = db.prepare(`INSERT INTO task (title, description, reward, min_level, status, publisher_id) VALUES (?, ?, ?, ?, ?, ?)`);
    
    sampleTasks.forEach((task, index) => {
        try {
            const result = insertTask.run(task.title, task.description, task.reward, task.min_level, 'OPEN', task.publisher_id);
            console.log(`✅ 任务 ${index + 1} 插入成功: "${task.title}" (ID: ${result.lastInsertRowid})`);
        } catch (err) {
            console.error(`❌ 插入任务 ${index + 1} 失败:`, err.message);
        }
    });
    
    // 验证数据
    const allTasks = db.prepare('SELECT id, title, reward, status FROM task').all();
    console.log('\n📊 当前数据库中的任务:');
    allTasks.forEach(task => {
        console.log(`  - ID: ${task.id}, 标题: ${task.title}, 悬赏: ¥${task.reward}, 状态: ${task.status}`);
    });
    
    console.log(`\n🎉 示例数据插入完成！共插入 ${sampleTasks.length} 个任务`);
    
} catch (err) {
    console.error('❌ 插入数据失败:', err.message);
} 