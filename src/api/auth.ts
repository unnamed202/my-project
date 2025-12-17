// 认证相关API服务
import apiClient from './index';

// 登录请求参数类型
interface LoginParams {
  username: string;
  password: string;
}

// 登录响应类型
interface LoginResponse {
  access: string; // JWT Access Token
  refresh: string; // JWT Refresh Token
  user: {
    id: string;
    username: string;
    email: string;
    phone: string;
    gender: 'male' | 'female' | 'other';
    position: string;
    department_id: string;
    role: 'super_admin' | 'general_manager' | 'dept_manager' | 'project_manager' | 'employee';
    last_operation_time: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by_id: string;
  };
}

// 刷新Token请求参数类型
interface RefreshTokenParams {
  refresh: string;
}

// 刷新Token响应类型
interface RefreshTokenResponse {
  access: string;
}

// 用户登录
export const login = async (loginData: LoginParams): Promise<LoginResponse> => {
  return await apiClient.post('auth/login/', loginData);
};

// 用户登出
export const logout = async (): Promise<void> => {
  return await apiClient.post('auth/logout/');
};

// 获取当前用户信息
export const getCurrentUser = async (): Promise<LoginResponse['user']> => {
  return await apiClient.get('auth/me/');
};

// 刷新Token
export const refreshToken = async (refreshData: RefreshTokenParams): Promise<RefreshTokenResponse> => {
  return await apiClient.post('auth/refresh/', refreshData);
};
