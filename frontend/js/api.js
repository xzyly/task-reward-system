const API_BASE_URL = 'http://localhost:3000/api';



async function makeRequest(endpoint, method = 'GET', body = null, auth = true) {

    const headers = {

        'Content-Type': 'application/json'

    };



    if (auth) {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
            window.location.href = 'auth.html';
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

        makeRequest('/register', 'POST', { username, password }, false),



    login: (username, password) =>

        makeRequest('/login', 'POST', { username, password }, false)

};



export const taskAPI = {

    getAllTasks: () => makeRequest('/tasks'),

    getTaskById: (id) => makeRequest(`/tasks/${id}`),

    createTask: (taskData) => makeRequest('/tasks', 'POST', taskData),

    acceptTask: (taskId, takerId) => makeRequest(`/tasks/${taskId}/accept`, 'POST', { taker_id: takerId }),

    finishTask: (taskId) => makeRequest(`/tasks/${taskId}/finish`, 'POST'),

    getMyTasks: () => makeRequest('/tasks/my-tasks')

};

export const friendAPI = {
    // 搜索用户
    searchUsers: (username) => makeRequest(`/friends/search?username=${encodeURIComponent(username)}`),
    
    // 发送好友申请
    sendFriendRequest: (friendId) => makeRequest('/friends/request', 'POST', { friendId }),
    
    // 获取好友申请列表
    getFriendRequests: () => makeRequest('/friends/requests'),
    
    // 处理好友申请
    respondToRequest: (requestId, action) => makeRequest('/friends/respond', 'POST', { requestId, action }),
    
    // 获取好友列表
    getFriends: () => makeRequest('/friends/list'),
    
    // 删除好友
    removeFriend: (friendId) => makeRequest('/friends/remove', 'POST', { friendId })
};

export const messageAPI = {
    // 发送消息
    sendMessage: (receiverId, content) => makeRequest('/messages/send', 'POST', { receiverId, content }),
    
    // 获取聊天记录
    getHistory: (friendId, page = 1, limit = 50) => 
        makeRequest(`/messages/history?friendId=${friendId}&page=${page}&limit=${limit}`),
    
    // 获取未读消息统计
    getUnreadStats: () => makeRequest('/messages/unread'),
    
    // 获取会话列表
    getConversations: () => makeRequest('/messages/conversations')
};
