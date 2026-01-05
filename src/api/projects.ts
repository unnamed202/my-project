// 项目管理API服务
import apiClient from './index';
import type { Project, ProjectMember, PaginatedResponse, PaginationParams } from '../types/index';

// 项目创建/更新请求类型
export interface ProjectCreateUpdate {
  name: string;
  code: string;
  description: string;
  manager: string;
  department: string;
  status: string;
  start_date: string;
  end_date: string | null;
}

// 获取项目列表
export const getProjects = async (params?: PaginationParams<{ status?: string; sort_by?: string; sort_order?: 'asc' | 'desc' }>): Promise<PaginatedResponse<Project>> => {
  return await apiClient.get('projects/', { params });
};

// 获取项目详情
export const getProjectDetail = async (projectId: string): Promise<Project> => {
  return await apiClient.get(`projects/${projectId}/`);
};

// 创建项目
export const createProject = async (projectData: ProjectCreateUpdate): Promise<Project> => {
  return await apiClient.post('projects/', projectData);
};

// 更新项目
export const updateProject = async (projectId: string, projectData: Partial<ProjectCreateUpdate>): Promise<Project> => {
  return await apiClient.put(`projects/${projectId}/`, projectData);
};

// 删除项目
export const deleteProject = async (projectId: string): Promise<void> => {
  return await apiClient.delete(`projects/${projectId}/`);
};

// 更新项目状态
export const updateProjectStatus = async (projectId: string, status: Project['status']): Promise<Project> => {
  return await apiClient.patch(`projects/${projectId}/status/`, { status });
};

// 获取项目成员列表
export const getProjectMembers = async (projectId: string, params?: PaginationParams): Promise<PaginatedResponse<ProjectMember> | ProjectMember[]> => {
  return await apiClient.get(`projects/${projectId}/members/`, { params });
};

// 添加项目成员
export const addProjectMember = async (projectId: string, memberData: {
  user_id: string;
  permission_status: ProjectMember['permission_status'];
  position: string;
  permissions: string[];
  valid_from: string;
  valid_to: string | null;
}): Promise<ProjectMember> => {
  return await apiClient.post(`projects/${projectId}/members/`, memberData);
};

// 移除项目成员
export const removeProjectMember = async (projectId: string, userId: string): Promise<void> => {
  return await apiClient.delete(`projects/${projectId}/members/${userId}/`);
};

// 批量移除项目成员
export const batchRemoveProjectMembers = async (projectId: string, userIds: string[]): Promise<void> => {
  return await apiClient.post(`projects/${projectId}/members/batch-remove/`, { user_ids: userIds });
};

// 更新成员权限
export const updateMemberPermissions = async (projectId: string, userId: string, permissions: string[]): Promise<ProjectMember> => {
  return await apiClient.patch(`projects/${projectId}/members/${userId}/permissions/`, { permissions });
};

// 用户申请加入项目
export const applyToJoinProject = async (projectId: string, applyData: {
  position: string;
  reason?: string;
}): Promise<any> => {
  return await apiClient.post(`projects/${projectId}/members/apply/`, applyData);
};

// 邀请成员加入项目
export const inviteMemberToProject = async (projectId: string, inviteData: {
  user_id: string;
  position: string;
  permissions: string[];
}): Promise<any> => {
  return await apiClient.post(`projects/${projectId}/members/invite/`, inviteData);
};

