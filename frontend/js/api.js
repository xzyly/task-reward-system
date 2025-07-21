const API_BASE_URL = '/api';



async function makeRequest(endpoint, method = 'GET', body = null, auth = true) {

    const headers = {

        'Content-Type': 'application/json'

    };



    if (auth) {

        const token = localStorage.getItem('token');

        if (!token) {

            window.location.href = '/auth.html';

            return;

        }

        headers['Authorization'] = `Bearer ${token}`;

    }



    const config = {

        method,

        headers

    };



    if (body) {

        config.body = JSON.stringify(body);

    }



    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            // 尝试解析错误信息，如果失败则使用默认错误消息
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: `请求失败: ${response.status} ${response.statusText}` };
            }
            throw new Error(errorData.error || '请求失败');
        }

        // 检查响应是否有内容
        const contentLength = response.headers.get('content-length');
        if (contentLength === '0' || !contentLength) {
            return null; // 或返回适当的值
        }

        return await response.json();
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }

}



export const authAPI = {

    register: (username, password) =>

        makeRequest('/auth/register', 'POST', { username, password }, false),



    login: (username, password) =>

        makeRequest('/auth/login', 'POST', { username, password }, false)

};



export const taskAPI = {

    getAllTasks: () => makeRequest('/tasks'),

    getTaskById: (id) => makeRequest(`/tasks/${id}`),

    createTask: (taskData) => makeRequest('/tasks', 'POST', taskData),

    acceptTask: (taskId) => makeRequest(`/tasks/${taskId}/accept`, 'POST'),

    finishTask: (taskId) => makeRequest(`/tasks/${taskId}/finish`, 'POST'),

    getMyTasks: () => makeRequest('/tasks/my-tasks')

};
