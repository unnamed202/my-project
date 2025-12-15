// API配置文件
import axios from 'axios';

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/api/v1/', // API基础URL
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 在这里可以添加认证信息，如token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 统一处理响应格式
    return response.data;
  },
  (error) => {
    // 统一处理错误
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;