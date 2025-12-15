// 项目管理API服务
import apiClient from './index';

// 定义项目数据类型
interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  manager_id: string;
  department_id: string;
  status: '立项' | '招投标' | '实施' | '交付' | '结项' | '归档';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  created_by_id: string;
  is_deleted: boolean;
}

// 项目成员类型
interface ProjectMember {
  user_id: string;
  project_id: string;
  permission_status: '有效' | '已禁用' | '待审批';
  position: string;
  permissions: string[];
  valid_from: string;
  valid_to: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    email: string;
    phone: string;
    position: string;
  };
}

// 获取项目列表
interface GetProjectsParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface ProjectsResponse {
  results: Project[];
  count: number;
  page: number;
  page_size: number;
}

export const getProjects = async (params?: GetProjectsParams): Promise<ProjectsResponse> => {
  return await apiClient.get('projects/', { params });
};

// 获取项目详情
export const getProjectDetail = async (projectId: string): Promise<Project> => {
  return await apiClient.get(`projects/${projectId}/`);
};

// 创建项目
export const createProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>): Promise<Project> => {
  return await apiClient.post('projects/', projectData);
};

// 更新项目
export const updateProject = async (projectId: string, projectData: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>>): Promise<Project> => {
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
export const getProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
  return await apiClient.get(`projects/${projectId}/members/`);
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

export type { Project, ProjectMember };