// 公共类型定义文件

// 用户数据类型
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  position: string;
  department: string;
  department_name: string;
  role: 'super_admin' | 'general_manager' | 'dept_manager' | 'employee';
  is_active: boolean;
  date_joined: string;
  last_login: string;
  department_info?: Department;
}

// 部门数据类型
export interface Department {
  id: string;
  name: string;
  code: string;
  manager: string;
  manager_name: string;
  created_at: string;
  updated_at: string;
}

// 项目数据类型
export interface Project {
  id: string; // UUID格式
  name: string; // 项目名称（必填）
  code: string; // 项目编号（必填）
  description: string; // 项目描述
  manager: string; // 项目负责人ID（UUID）
  manager_name: string; // 项目负责人姓名（只读）
  department: string; // 所属部门ID（UUID）
  department_name: string; // 所属部门名称（只读）
  status: string; // 项目状态（枚举：planning/tendering/execution/delivery/completed/archived）
  start_date: string; // 项目开始时间（日期格式）
  end_date: string | null; // 项目结束时间（可空，日期格式）
  created_at: string; // 创建时间（日期时间格式，只读）
  updated_at: string; // 更新时间（日期时间格式，只读）
  created_by: string; // 创建人ID（UUID，只读）
  created_by_name: string; // 创建人姓名（只读）
}

// 项目成员类型
export interface ProjectMember {
  user_id: string;
  project_id: string;
  permission_status: '有效' | '已禁用' | '待审批';
  position: string;
  permissions: string[];
  valid_from: string;
  valid_to: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
}

// 文件数据类型
export interface Document {
  id: string;
  name: string;
  original_name: string;
  file_type: 'document' | 'zip';
  category: '招投标' | '合同' | '成果资料' | '过程资料' | '原始资料' | '资料交接清单';
  minio_path: string;
  minio_bucket: string;
  file_size: number;
  mime_type: string;
  version: number;
  parent_version_id: string | null;
  project_id: string;
  uploader_id: string;
  approver_id: string | null;
  approval_status: '待审批' | '已通过' | '已驳回';
  approval_time: string | null;
  tags: string[];
  related_files: string[];
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

// 文件版本类型
export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  name: string;
  file_size: number;
  uploader_id: string;
  upload_time: string;
  is_current: boolean;
}

// 文件审批历史类型
export interface DocumentApprovalHistory {
  id: string;
  document_id: string;
  approver_id: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approval_comment: string;
  approval_time: string;
  approver?: User;
}

// 文件标签类型
export interface DocumentTag {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// 通用分页参数类型
export interface PaginationParams<T = Record<string, never>> {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: any;
}