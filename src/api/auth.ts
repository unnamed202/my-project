// 认证相关API服务
import apiClient from './index';
import type { User } from '../types/index';

// 登录请求参数类型
interface LoginParams {
  username: string;
  password: string;
}

// 登录响应类型
interface LoginResponse {
  access: string; // JWT Access Token
  refresh: string; // JWT Refresh Token
  user: User;
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
