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

// 根据状态获取标签类型
const getTagType = (status: string): string => {
  const statusMap: Record<string, string> = {
    '立项': 'info',
    '招投标': 'warning',
    '实施': 'primary',
    '交付': 'success',
    '结项': 'success',
    '归档': 'info'
  }
  return statusMap[status] || 'info'
}

// 格式化日期
const formatDate = (dateString: string | null): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long'
  })
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
    
    // 使用模拟数据代替API调用
    const mockProjects: Project[] = [
      {
        id: '1',
        name: '项目1项目1',
        code: 'PROJ-2024-001',
        description: '项目1描述1',
        manager_id: 'user-001',
        department_id: 'dept-001',
        status: '实施',
        start_date: '2024-01-15',
        end_date: '2024-06-30',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-03-15T14:30:00Z',
        created_by_id: 'user-001',
        is_deleted: false
      },
      {
        id: '2',
        name: '项目222',
        code: 'PROJ-2024-002',
        description: '描述222',
        manager_id: 'user-002',
        department_id: 'dept-002',
        status: '立项',
        start_date: '2024-04-01',
        end_date: '2024-09-30',
        created_at: '2024-03-20T09:15:00Z',
        updated_at: '2024-03-25T11:20:00Z',
        created_by_id: 'user-003',
        is_deleted: false
      }
    ];
    projects.value = mockProjects;
    
/*
    // 原API调用代码
    const response = await getProjects({
      page: 1,
      page_size: 100,
      search: searchProject.value
    })
    projects.value = response.results
    */

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