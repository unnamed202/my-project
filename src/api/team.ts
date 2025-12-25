// 团队管理API服务
import apiClient from './index';
import type { User, Department, PaginatedResponse, PaginationParams } from '../types/index';



// 获取部门列表
export const getDepartments = async (params?: PaginationParams): Promise<PaginatedResponse<Department>> => {
  return await apiClient.get('departments/', { params });
};

// 创建部门
export const createDepartment = async (departmentData: Omit<Department, 'id' | 'created_at' | 'updated_at' | 'manager' | 'children'>): Promise<Department> => {
  return await apiClient.post('departments/', departmentData);
};

// 更新部门
export const updateDepartment = async (departmentId: string, departmentData: Partial<Omit<Department, 'id' | 'created_at' | 'updated_at' | 'manager' | 'children'>>): Promise<Department> => {
  return await apiClient.put(`departments/${departmentId}/`, departmentData);
};

// 删除部门
export const deleteDepartment = async (departmentId: string): Promise<void> => {
  return await apiClient.delete(`departments/${departmentId}/`);
};

// 获取部门成员列表
export const getDepartmentMembers = async (departmentId: string, params?: PaginationParams): Promise<PaginatedResponse<User>> => {
  return await apiClient.get(`departments/${departmentId}/members/`, { params });
};

// 移交团队
export const transferTeam = async (departmentId: string, newManagerId: string): Promise<Department> => {
  return await apiClient.post(`departments/${departmentId}/transfer/`, { manager_id: newManagerId });
};

// 合并团队
export const mergeTeams = async (sourceDepartmentId: string, targetDepartmentId: string): Promise<Department> => {
  return await apiClient.post('departments/merge/', {
    source_department_id: sourceDepartmentId,
    target_department_id: targetDepartmentId
  });
};

// 解散团队
export const dissolveTeam = async (departmentId: string): Promise<void> => {
  return await apiClient.post(`departments/${departmentId}/dissolve/`);
};

// 获取用户列表
export const getUsers = async (params?: PaginationParams<{ department_id?: string; role?: string }>): Promise<PaginatedResponse<User>> => {
  return await apiClient.get('users/', { params });
};

// 创建新用户
export const createUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'department_name'>): Promise<User> => {
  return await apiClient.post('users/', userData);
};

// 添加用户到部门
export const addUsersToDepartment = async (departmentId: string, userIds: string[]): Promise<any> => {
  return await apiClient.post(`departments/${departmentId}/members/`, { user_ids: userIds });
};

// 获取用户详情
export const getUserById = async (userId: string): Promise<User> => {
  return await apiClient.get(`users/${userId}/`);
};

// 更新用户信息
export const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
  return await apiClient.put(`users/${userId}/`, userData);
};

// 从部门移除成员
export const removeUserFromDepartment = async (departmentId: string, userId: string): Promise<void> => {
  return await apiClient.delete(`departments/${departmentId}/members/${userId}/`);
};

export type { User, Department };