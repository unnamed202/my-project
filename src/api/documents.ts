// 文件管理API服务
import axios from 'axios';
import apiClient from './index';

// 定义文件数据类型
interface Document {
  id: string;
  name: string;
  original_name: string;
  file_type: 'file' | 'zip';
  category: string;
  minio_path: string;
  minio_bucket: string;
  file_size: number;
  mime_type: string;
  version: number;
  parent_version_id: string | null;
  parent_version_name: string | null;
  project: string;
  project_name: string;
  uploader: string;
  uploader_name: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

// 文件版本类型
interface DocumentVersion {
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
interface DocumentApprovalHistory {
  id: string;
  document_id: string;
  approver_id: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approval_comment: string;
  approval_time: string;
  approver?: {
    id: string;
    username: string;
    email: string;
  };
}

// 文件标签类型
interface DocumentTag {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
}

// 上传文件
export const uploadFile = async (file: File, projectId: string, category: Document['category']): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('project_id', projectId);
  formData.append('category', category);
  
  return await apiClient.post('documents/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// 下载文件
export const downloadFile = async (documentId: string): Promise<void> => {
  // 创建一个新的axios实例，不使用默认的响应拦截器
  const downloadClient = axios.create({
    baseURL: '/api/v1/',
    timeout: 10000
  });
  
  const response = await downloadClient.get(`documents/${documentId}/download/`, {
    responseType: 'blob'
  });
  
  // 创建下载链接
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'file'); // 文件名可以从响应头获取
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// 预览文件
export const previewFile = async (documentId: string): Promise<string> => {
  return await apiClient.get(`documents/${documentId}/preview/`);
};

// 删除文件
export const deleteFile = async (documentId: string): Promise<void> => {
  return await apiClient.delete(`documents/${documentId}/`);
};

// 获取项目文件列表
interface GetProjectDocumentsParams {
  category?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const getProjectDocuments = async (projectId: string, params?: GetProjectDocumentsParams): Promise<Document[]> => {
  return await apiClient.get(`projects/${projectId}/documents/`, { params });
};

// 获取文件详情
export const getDocumentDetail = async (documentId: string): Promise<Document> => {
  return await apiClient.get(`documents/${documentId}/`);
};

// 更新文件信息
export const updateDocument = async (documentId: string, documentData: Partial<Omit<Document, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>>): Promise<Document> => {
  return await apiClient.patch(`documents/${documentId}/`, documentData);
};

// 获取文件版本历史
export const getDocumentVersions = async (documentId: string): Promise<DocumentVersion[]> => {
  return await apiClient.get(`documents/${documentId}/versions/`);
};

// 版本回滚
export const rollbackDocumentVersion = async (documentId: string, version: number): Promise<Document> => {
  return await apiClient.post(`documents/${documentId}/rollback/`, { version });
};

// 审批文件
export const approveDocument = async (documentId: string, approvalData: {
  approval_status: 'approved' | 'rejected';
  approval_comment: string;
}): Promise<DocumentApprovalHistory> => {
  return await apiClient.post(`documents/${documentId}/approve/`, approvalData);
};

// 获取审批历史
export const getDocumentApprovalHistory = async (documentId: string): Promise<DocumentApprovalHistory[]> => {
  return await apiClient.get(`documents/${documentId}/approval-history/`);
};

// 获取标签列表
export const getDocumentTags = async (): Promise<DocumentTag[]> => {
  return await apiClient.get('tags/');
};

// 创建标签
export const createDocumentTag = async (tagData: Omit<DocumentTag, 'id' | 'created_at'>): Promise<DocumentTag> => {
  return await apiClient.post('tags/', tagData);
};

// 为文件添加标签
export const addDocumentTag = async (documentId: string, tagId: string): Promise<void> => {
  return await apiClient.post(`documents/${documentId}/tags/`, { tag_id: tagId });
};

// 移除文件标签
export const removeDocumentTag = async (documentId: string, tagId: string): Promise<void> => {
  return await apiClient.delete(`documents/${documentId}/tags/${tagId}/`);
};

export type { Document, DocumentVersion, DocumentApprovalHistory, DocumentTag };