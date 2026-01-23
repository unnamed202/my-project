<template>
  <div class="project-detail-container">
    <!-- 加载状态 -->
    <el-loading v-model="loading" fullscreen text="加载中..." />
    
    <!-- 错误提示 -->
    <div v-if="error" class="error-alert">
      <el-alert
        title="错误"
        :description="error"
        type="error"
        show-icon
        closable
        @close="error = ''"
      />
    </div>
    
    <!-- 页面标题和操作按钮 -->
    <div class="detail-header">
      <div class="header-left">
        <el-button type="text" @click="goToHome" class="back-home-btn">
          <el-icon><ArrowLeft /></el-icon>返回主页
        </el-button>
        <el-select v-model="selectedProjectId" placeholder="选择项目" class="project-select" @change="handleProjectChange">
          <el-option
            v-for="proj in projects"
            :key="proj.id"
            :label="proj.name"
            :value="proj.id"
          />
        </el-select>
      </div>
      <div class="page-title">{{ project.name || '项目详情' }}</div>
      <div class="page-actions">
        <el-button type="default" class="action-btn" @click="loadProjectDetail">更新数据</el-button>
        <el-button type="default" class="action-btn">添加人员</el-button>
        <el-upload
          class="upload-btn"
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
        >
          <el-button type="primary" class="action-btn">
            <el-icon><Upload /></el-icon>上传文件
          </el-button>
        </el-upload>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="detail-search">
      <el-input
        v-model="searchFile"
        placeholder="搜索文件"
        class="file-search"
        prefix-icon="Search"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
        </template>
      </el-input>
    </div>

    <!-- 主要内容区：左侧分类导航 + 右侧文件列表 -->
    <div class="main-content">
      <!-- 左侧文件分类导航 -->
      <div class="file-category-nav">
        <el-menu
          default-active="overview"
          class="el-menu-vertical-demo"
          @select="handleCategorySelect"
        >
          <!-- 总览 -->
          <el-menu-item index="overview">
            <el-icon><Menu /></el-icon>
            <span>总览</span>
          </el-menu-item>
          
          <!-- 文档分类 -->
          <el-sub-menu index="categories">
            <template #title>
              <el-icon><Menu /></el-icon>
              <span>文档分类</span>
            </template>
            <el-menu-item-group>
              <el-sub-menu
                v-for="category in fileCategories"
                :key="category"
                :index="category"
              >
                <template #title>
                  <el-icon><Folder /></el-icon>
                  <span>{{ category }}</span>
                </template>
                <!-- 显示该分类下的文件数量 -->
                <el-menu-item :index="`${category}_files`">
                  {{ getCategoryFileCount(category) }} 个文件
                </el-menu-item>
              </el-sub-menu>
            </el-menu-item-group>
          </el-sub-menu>
          
          <!-- 我的上传 -->
          <el-sub-menu index="my_upload">
            <template #title>
              <el-icon><Upload /></el-icon>
              <span>我的上传</span>
            </template>
            <el-menu-item-group>
              <el-menu-item index="my_upload_pending">
                <el-icon><Clock /></el-icon>
                <span>审批中</span>
                <el-tag size="small" type="warning" class="status-tag">3</el-tag>
              </el-menu-item>
              <el-menu-item index="my_upload_rejected">
                <el-icon><Close /></el-icon>
                <span>被驳回</span>
                <el-tag size="small" type="danger" class="status-tag">2</el-tag>
              </el-menu-item>
              <el-menu-item index="my_upload_approved">
                <el-icon><Check /></el-icon>
                <span>已通过</span>
                <el-tag size="small" type="success" class="status-tag">12</el-tag>
              </el-menu-item>
            </el-menu-item-group>
          </el-sub-menu>
          
          <!-- 项目成员 -->
        <el-menu-item index="members" @click="handleMembersClick">
          <el-icon><User /></el-icon>
          <span>项目成员</span>
        </el-menu-item>
        </el-menu>
      </div>

      <!-- 右侧文件列表 -->
      <div class="file-table-container">
        <el-table
          :data="currentFiles"
          style="width: 100%"
          border
          stripe
          class="file-table"
          v-loading="fileLoading"
          :empty-text="error || '暂无文件数据'"
        >
          <el-table-column prop="name" label="文件名称" min-width="200" />
          <el-table-column prop="size" label="文件大小" width="100" />
          <el-table-column prop="type" label="文件类型" width="100" />
          <el-table-column prop="tags" label="自定义标签" width="150">
            <template #default="scope">
              <el-tag
                v-for="tag in scope.row.tags"
                :key="tag"
                size="small"
                :type="getTagType(tag)"
              >
                {{ tag }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="version" label="版本" width="80" />
          <el-table-column prop="uploadTime" label="上传时间" width="150" />
          <el-table-column prop="uploader" label="上传人" width="100" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="handlePreview(scope.row)">
                <el-icon><View /></el-icon>查看文件
              </el-button>
              <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button size="small" @click="handleUploadNewVersion(scope.row)">上传新版本</el-button>
              <el-button size="small" @click="handleAddRelatedFile(scope.row)">添加关联文件</el-button>
              <el-button size="small" type="success" @click="handleDownload(scope.row)">
                <el-icon><Download /></el-icon>下载
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(scope.row)">
                <el-icon><Delete /></el-icon>删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        background
        layout="total, prev, pager, next, jumper"
        :total="totalFiles"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="(page: number) => { currentPage = page; loadFiles(); }"
        @size-change="(size: number) => { pageSize = size; currentPage = 1; loadFiles(); }"
      />
    </div>

    <!-- 文件预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="文件预览"
      width="80%"
      destroy-on-close
    >
      <div v-if="previewFile" class="file-preview">
        <div class="preview-header">
          <h3>{{ previewFile.name }}</h3>
          <div class="preview-meta">
            <span>{{ previewFile.size }}</span>
            <span>{{ previewFile.type }}</span>
            <span>{{ previewFile.uploadTime }}</span>
          </div>
        </div>
        <div class="preview-content">
          <!-- 简单的文件预览模拟 -->
          <div v-if="previewFile.type === 'pdf'" class="pdf-preview">
            <el-icon size="64" color="#409EFF"><Document /></el-icon>
            <p>PDF文件预览区域</p>
          </div>
          <div v-else-if="previewFile.type === 'xls' || previewFile.type === 'xlsx'" class="excel-preview">
            <el-icon size="64" color="#67C23A"><Document /></el-icon>
            <p>Excel文件预览区域</p>
          </div>
          <div v-else class="file-preview-placeholder">
            <el-icon size="64" color="#909399"><Document /></el-icon>
            <p>暂不支持该类型文件预览</p>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="previewVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleDownload(previewFile)">
            <el-icon><Download /></el-icon>下载
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 项目成员弹窗 -->
    <ProjectMembersDialog
      v-model:visible="membersDialogVisible"
      :project-id="projectId"
      :project-manager="currentProjectManager"
      @add-member="handleAddMember"
    />
    
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import { Upload, View, Download, Delete, Document, Menu, Folder, Clock, Check, ArrowLeft, User } from '@element-plus/icons-vue'

// 引入API服务
import { getProjectDetail, getProjects } from '../api/projects'
import { getProjectDocuments, deleteFile } from '../api/documents'

// 引入项目类型
import type { Project } from '../types/index'

// 引入项目成员弹窗组件
import ProjectMembersDialog from '../components/ProjectMembersDialog.vue'

// 定义文件数据类型
interface FileItem {
  id: string
  name: string
  size: string
  type: string
  tags: string[]
  version: string
  uploadTime: string
  uploader: string
  category: string
}

// 引入API返回的文件类型
import type { Document as DocumentType } from '../api/documents'


// 获取路由参数
const route = useRoute()
const router = useRouter()
const projectId = ref(route.params.id as string)

// 项目选择相关
const projects = ref<Project[]>([])
const selectedProjectId = ref(projectId.value)

// 项目状态相关
const projectStatuses = ref(['实施中', '已完成', '已暂停', '已取消'])
const selectedStatus = ref('')

// 项目数据
const project = ref<Project>({} as Project)

// 搜索框数据
const searchFile = ref('')

// 文件预览对话框
const previewVisible = ref(false)
const previewFile = ref<FileItem | null>(null)

// 项目成员弹窗
const membersDialogVisible = ref(false)
const currentProjectManager = ref('')

// 文件分类
const fileCategories = ref(['招投标文件', '合同', '项目资料', '成果资料', '过程资料', '原始资料'])

// 当前选中的分类
const selectedCategory = ref('all')

// 数据加载状态
const loading = ref(false)
const fileLoading = ref(false)

// 错误信息
const error = ref('')

// 文件列表
const files = ref<FileItem[]>([])

// 分页信息
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 将API返回的Document类型转换为组件需要的FileItem类型
const convertToFileItem = (doc: DocumentType): FileItem => {
  return {
    id: doc.id,
    name: doc.name,
    size: formatFileSize(doc.file_size),
    type: doc.file_type,
    tags: doc.tags || [],
    version: `V${doc.version}`,
    uploadTime: formatDate(doc.created_at),
    uploader: doc.uploader_name || '未知', // 使用API提供的上传者名称
    category: doc.category || '其他'
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 加载项目详情
const loadProjectDetail = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await getProjectDetail(projectId.value)
    // 转换API返回的Project类型为组件需要的类型
    project.value = {
      ...response,
      statusDate: response.updated_at,
      date: response.created_at,
      files: 0 // API没有提供文件数量
    }
    // 项目成员将在打开弹窗时加载
  } catch (err: any) {
    error.value = '获取项目详情失败'
    ElMessage.error(err.message || '获取项目详情失败')
  } finally {
    loading.value = false
  }
}



// 加载文件列表
const loadFiles = async () => {
  fileLoading.value = true
  error.value = ''
  try {
    const response = await getProjectDocuments(projectId.value, {
      // 新API不支持分页，移除分页参数
      search: searchFile.value
    })
    
    // 转换文件格式 - 新API直接返回文件数组
    files.value = Array.isArray(response) ? response.map(convertToFileItem) : []
    total.value = files.value.length
  } catch (err: any) {
    error.value = '获取文件列表失败'
    ElMessage.error(err.message || '获取文件列表失败')
  } finally {
    fileLoading.value = false
  }
}

// 搜索文件
const handleSearch = () => {
  currentPage.value = 1
  loadFiles()
}

// 过滤文件列表
const filteredFiles = computed(() => {
  if (!searchFile.value) {
    return files.value
  }
  return files.value.filter(file => {
    return file.name.includes(searchFile.value)
  })
})

// 根据分类获取文件
const getFilesByCategory = (category: string) => {
  return filteredFiles.value.filter(file => file.category === category)
}

// 获取分类下的文件数量
const getCategoryFileCount = (category: string) => {
  return getFilesByCategory(category).length
}

// 当前显示的文件列表
const currentFiles = computed(() => {
  if (selectedCategory.value === 'all') {
    return filteredFiles.value
  }
  
  // 检查是否是具体分类
  for (const category of fileCategories.value) {
    if (selectedCategory.value === category) {
      return getFilesByCategory(category)
    }
  }
  
  return filteredFiles.value
})

// 总文件数
const totalFiles = computed(() => total.value)
  
// 处理分类选择
const handleCategorySelect = (index: string) => {
  // 解析index以确定选择的是哪个分类
  if (index === 'overview') {
    selectedCategory.value = '';
  } else if (index === 'categories') {
    // 如果是文档分类主菜单，不做特殊处理
    selectedCategory.value = '';
  } else if (fileCategories.value.includes(index)) {
    // 如果是某个分类的主菜单，不做特殊处理
    selectedCategory.value = '';
  } else if (index.endsWith('_files')) {
    // 如果是分类下的文件选择，截取分类名称
    selectedCategory.value = index.replace('_files', '');
  } else {
    // 处理我的上传的子项
    const uploadIndex = index.split('_')[0];
    if (uploadIndex === 'my_upload') {
      selectedCategory.value = index;
    }
  }
}
  
// 根据标签获取标签类型
const getTagType = (tag: string): string => {
  const tagColorMap: Record<string, string> = {
    '绿色': 'success',
    '蓝色': 'primary',
    '金色': 'warning',
    '红色': 'danger'
  }
  return tagColorMap[tag] || 'info'
}

// 文件上传处理
const handleFileChange = (file: any) => {
  ElMessage.success(`文件 ${file.name} 上传成功`)
  // 实际项目中这里应该有文件上传的逻辑
  // 上传成功后重新加载文件列表
  loadFiles()
}

// 预览文件
const handlePreview = (file: FileItem) => {
  previewFile.value = file
  previewVisible.value = true
}

// 编辑文件
const handleEdit = (file: FileItem) => {
  ElMessage.info(`编辑文件 ${file.name}`)
}

// 上传新版本
const handleUploadNewVersion = (file: FileItem) => {
  ElMessage.info(`为文件 ${file.name} 上传新版本`)
}

// 添加关联文件
const handleAddRelatedFile = (file: FileItem) => {
  ElMessage.info(`为文件 ${file.name} 添加关联文件`)
}

// 下载文件
const handleDownload = (file: FileItem | null) => {
  if (file) {
    ElMessage.success(`下载文件 ${file.name}`)
    // 实际项目中这里应该有文件下载的逻辑
  }
}

// 删除文件
const handleDelete = async (file: FileItem) => {
  try {
    await deleteFile(file.id.toString())
    ElMessage.success(`删除文件 ${file.name} 成功`)
    // 删除成功后重新加载文件列表
    loadFiles()
  } catch (err: any) {
    ElMessage.error(err.message || '删除文件失败')
  }
}

// 生命周期钩子：获取项目数据
onMounted(() => {
  loadProjects()
  loadProjectDetail()
  loadFiles()
})

// 加载项目列表
const loadProjects = async () => {
  try {
    const response = await getProjects()
    projects.value = response.results
    selectedProjectId.value = projectId.value
  } catch (err: any) {
    ElMessage.error(err.message || '获取项目列表失败')
  }
}

// 返回主页
const goToHome = () => {
  router.push('/')
}

// 处理项目选择
const handleProjectChange = (id: string) => {
  projectId.value = id
  loadProjectDetail()
  loadFiles()
}

// 处理项目成员点击
const handleMembersClick = () => {
  // 记录当前项目负责人
  currentProjectManager.value = project.value?.manager || ''
  // 显示项目成员弹窗
  membersDialogVisible.value = true
}

// 处理添加成员
const handleAddMember = () => {
  // 添加成员的逻辑将在后续实现
  ElMessage.info('添加新成员功能将在后续实现')
}
</script>

<style scoped>
.project-detail-container {
  width: 100%;
  height: 100%;
  padding: 0 20px 20px 20px;
}

/* 错误提示样式 */
.error-alert {
  margin-bottom: 20px;
  width: 100%;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-top: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.back-home-btn {
  font-size: 14px;
  color: #606266;
}

.project-select, .status-select {
  width: 200px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  margin: 0;
}

.detail-search {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.file-search {
  width: 300px;
}

.file-table-container {
  margin-bottom: 20px;
}

.file-table {
  margin-bottom: 20px;
}

.file-table th {
  background-color: #f5f7fa;
  font-weight: 600;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 文件预览样式 */
.file-preview {
  width: 100%;
  height: 500px;
  display: flex;
  flex-direction: column;
}

.preview-header {
  margin-bottom: 20px;
}

.preview-header h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 600;
}

.preview-meta {
  font-size: 14px;
  color: #606266;
  display: flex;
  gap: 20px;
}

.preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
}

.pdf-preview,
.excel-preview,
.file-preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.pdf-preview p,
.excel-preview p,
.file-preview-placeholder p {
  font-size: 16px;
  color: #606266;
}
/* 侧边栏样式 */
.main-content {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.file-category-nav {
  width: 240px;
  min-width: 200px;
  height: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  background-color: #ffffff;
  flex-shrink: 0;
}

.file-category-nav .el-menu {
  border-right: none;
  min-height: 100%;
}

.file-category-nav .el-menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-count {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

.status-tag {
  margin-left: auto;
}

/* 右侧文件列表样式 */
.file-table-container {
  flex: 1;
  min-width: 300px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
  background-color: #ffffff;
}

/* 调整主内容区样式 */
.main-content {
  margin-top: 20px;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
  
  .file-category-nav {
    width: 100%;
    margin-bottom: 20px;
  }
  
  .file-table-container {
    width: 100%;
  }
}
</style>