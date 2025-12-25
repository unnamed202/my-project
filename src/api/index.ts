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
    // 登录和刷新token请求不需要Authorization头
    const noAuthPaths = ['auth/login/', 'auth/refresh/'];
    const isAuthPath = noAuthPaths.some(path => config.url?.includes(path));
    
    if (!isAuthPath) {
      // 在这里可以添加认证信息，如token
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
  async (error) => {
    // 统一处理错误
    const originalRequest = error.config;
    
    // 处理401错误（token过期）
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 获取refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // 如果没有refresh token，跳转到登录页面
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // 调用刷新token的API
        const { data } = await axios.post('/api/v1/auth/refresh/', { refresh: refreshToken });
        
        // 保存新的access token
        localStorage.setItem('token', data.access);
        
        // 更新当前请求的Authorization头
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        
        // 重新发送原始请求
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 刷新token失败，跳转到登录页面
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('isLoggedIn');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;