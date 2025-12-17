<template>
  <div class="home-container">
    <!-- 页面标题和操作按钮 -->
    <div class="home-header">
      <div class="page-title">主页</div>
      <div class="page-actions">
        <el-button type="default" class="action-btn" @click="fetchProjects">更新数据</el-button>
        <el-button type="default" class="action-btn">添加人员</el-button>
        <el-button type="primary" class="action-btn">新建项目</el-button>
      </div>
    </div>

    <!-- 搜索框 -->
    <el-input
      v-model="searchProject"
      placeholder="搜索项目"
      class="project-search"
      prefix-icon="Search"
      clearable
      @keyup.enter="handleSearch"
    />

    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      type="error"
      :title="error"
      show-icon
      class="error-alert"
    />

    <!-- 项目卡片列表 -->
    <div class="project-grid">
      <el-skeleton :rows="8" animated v-if="loading" style="margin-bottom: 20px;" />
      <template v-else-if="filteredProjects.length > 0">
        <el-card
          v-for="project in filteredProjects"
          :key="project.id"
          class="project-card"
          shadow="hover"
          @click="goToProjectDetail(project.id)"
          style="cursor: pointer;"
        >
          <div class="card-header">
            <span class="card-date">{{ formatDate(project.start_date) }}</span>
          </div>
          <div class="card-title">{{ project.name }}</div>
          <div class="card-description">{{ project.description || '暂无项目描述' }}</div>
          <div class="card-status">
            <el-tag :type="getTagType(project.status)">
              {{ project.status }}
            </el-tag>
            <span class="status-date">{{ formatStatusDate(project.updated_at) }}</span>
          </div>
          <div class="card-footer">
            <div class="card-meta">
              <el-icon class="meta-icon"><Document /></el-icon>
              <span>0 件文件</span>
            </div>
            <div class="card-meta">
              <el-icon class="meta-icon"><User /></el-icon>
              <span>0 人</span>
            </div>
          </div>
        </el-card>
      </template>
      <div v-else class="no-data">
        <el-empty description="暂无项目数据" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Document, User } from '@element-plus/icons-vue'
import { getProjects } from '../api/projects'
import type { Project } from '../api/projects'

// 搜索框数据
const searchProject = ref('')
// 项目列表数据
const projects = ref<Project[]>([])
// 加载状态
const loading = ref(false)
// 错误信息
const error = ref('')

// 路由
const router = useRouter()

// 根据状态获取标签类型（后端返回英文状态值）
const getTagType = (status: string): string => {
  const statusMap: Record<string, string> = {
    'approval': 'warning', // 审批中
    'bidding': 'warning', // 招投标
    'implementation': 'primary', // 实施中
    'delivery': 'success', // 交付
    'completion': 'success', // 已完成
    'archived': 'info' // 已归档
  }
  return statusMap[status] || 'info'
}

// 获取状态中文显示文本
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'approval': '审批中',
    'bidding': '招投标',
    'implementation': '实施中',
    'delivery': '交付',
    'completion': '已完成',
    'archived': '已归档'
  }
  return statusMap[status] || status
}

// 格式化日期（带错误处理）
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '暂无日期'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '无效日期'
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long'
    })
  } catch (error) {
    return '无效日期'
  }
}

// 格式化状态日期
const formatStatusDate = (dateString: string | null): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}

// 点击项目卡片进入详情页
const goToProjectDetail = (projectId: string) => {
  router.push(`/project/${projectId}`)
}

// 获取项目列表数据
const fetchProjects = async () => {
  loading.value = true
  error.value = ''
  
  try {
    
    // 调用真实API获取项目列表
    const response = await getProjects({
      page: 1,
      page_size: 100,
      search: searchProject.value
    })
    projects.value = response.results
    


  } catch (err) {
    error.value = '加载项目列表失败，请稍后重试'
    console.error('获取项目列表失败:', err)
  } finally {
    loading.value = false
  }
}

// 过滤项目列表
const filteredProjects = computed(() => {
  if (!searchProject.value) {
    return projects.value
  }
  return projects.value.filter(project => {
    return project.name.includes(searchProject.value) ||
           project.description?.includes(searchProject.value)
  })
})

// 监听搜索框变化，重新获取数据
const handleSearch = () => {
  fetchProjects()
}

// 组件挂载时获取数据
onMounted(() => {
  fetchProjects()
})
</script>

<style scoped>
.home-container {
  width: 100%;
  height: 100%;
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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

.project-search {
  width: 300px;
  margin-bottom: 20px;
}

.error-alert {
  margin-bottom: 20px;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.no-data {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.project-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
}

.project-card:hover {
  transform: translateY(-5px);
}

.card-header {
  text-align: right;
  margin-bottom: 10px;
}

.card-date {
  font-size: 12px;
  color: #909399;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-department {
  font-size: 12px;
  color: #606266;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.department-icon {
  font-size: 14px;
  color: #909399;
}

.card-description {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.card-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.status-date {
  font-size: 12px;
  color: #909399;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #606266;
}

.meta-icon {
  font-size: 16px;
}
</style>