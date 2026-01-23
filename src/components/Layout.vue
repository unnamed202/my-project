<template>
  <el-container class="layout-container">
    <!-- 顶部导航栏 -->
    <el-header class="layout-header">
      <div class="header-left">
        <el-dropdown trigger="click">
          <span class="el-dropdown-link system-name">
            系统名称 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>系统设置</el-dropdown-item>
              <el-dropdown-item>关于我们</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <span class="department-name">
          {{ currentUser?.department_name || '未知部门' }}
        </span>
      </div>
      <div class="header-right">
        <el-input
          v-model="searchText"
          placeholder="搜索"
          class="search-input"
          prefix-icon="Search"
          clearable
        />
        <el-dropdown trigger="click" class="user-dropdown">
          <div class="user-info">
            <el-avatar size="small" class="user-avatar">
              {{ currentUser?.full_name?.charAt(0) || '?' }}
            </el-avatar>
            <span class="user-name">{{ currentUser?.full_name || '未知用户' }}</span>
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>个人中心</el-dropdown-item>
              <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container>
      <!-- 左侧菜单：仅在非项目详情页面显示 -->
      <el-aside
        v-if="!isProjectDetailPage"
        width="200px" 
        class="layout-aside"
      >
        <el-menu
            :default-active="activeMenu"
            class="el-menu-vertical-demo"
            @open="handleOpen"
            @close="handleClose"
            background-color="#545c64"
            text-color="#fff"
            active-text-color="#ffd04b"
            router
          >
            <el-menu-item index="/">
              <el-icon><House /></el-icon>
              <span>主页</span>
            </el-menu-item>
            <el-sub-menu index="2">
              <template #title>
                <el-icon><UserIcon /></el-icon>
                <span>团队管理</span>
              </template>
              <el-menu-item index="/team">成员管理</el-menu-item>
              <el-menu-item index="/team/project-groups">项目组管理</el-menu-item>
              <el-menu-item index="/team/list">团队列表</el-menu-item>
              <el-menu-item index="/team/settings">团队设置</el-menu-item>
            </el-sub-menu>
            <el-menu-item index="/todo">
              <el-icon><Document /></el-icon>
              <span>待办</span>
            </el-menu-item>
            <el-menu-item index="/assets">
              <el-icon><Box /></el-icon>
              <span>资产中心</span>
            </el-menu-item>
          </el-menu>
      </el-aside>

      <!-- 主内容区域 -->
      <el-main class="layout-main" :class="{ 'without-aside': isProjectDetailPage }">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { House, User as UserIcon, Document, Box, ArrowDown } from '@element-plus/icons-vue'
import { getCurrentUser } from '../api/auth'
import type { User } from '../types/index'

// 路由实例
const router = useRouter()
const route = useRoute()

// 搜索文本
const searchText = ref('')

// 当前用户信息
const currentUser = ref<User | null>(null)

// 加载当前用户信息
const loadCurrentUser = async () => {
  try {
    const user = await getCurrentUser()
    currentUser.value = user
  } catch (error) {
    console.error('获取当前用户信息失败:', error)
  }
}

// 判断是否为项目详情页面
const isProjectDetailPage = computed(() => {
  return route.path.startsWith('/project/')
})

// 当前激活的菜单
const activeMenu = computed(() => {
  const path = route.path
  if (path === '/') return '/'
  if (path === '/team') return '/team'
  if (path === '/team/project-groups') return '/team/project-groups'
  if (path === '/team/list') return '/team/list'
  if (path === '/team/settings') return '/team/settings'
  if (path === '/todo') return '/todo'
  if (path.startsWith('/project/')) return '/'
  return path
})

// 菜单展开回调
const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}

// 菜单收起回调
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}

// 退出登录处理函数
const handleLogout = () => {
  // 清除登录状态
  localStorage.removeItem('isLoggedIn')
  // 跳转到登录页面
  router.push('/login')
  ElMessage.success('已退出登录')
}

// 组件挂载时加载用户信息
onMounted(() => {
  loadCurrentUser()
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  background-color: #f0f2f5;
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
}

.system-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.department-name {
  font-size: 14px;
  font-weight: 600; /* 字体加粗 */
  color: #606266;
  margin-left: 24px; /* 增加与系统名称的间距 */
  padding: 4px 8px;
  background-color: #f0f2f5;
  border-radius: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-input {
  width: 200px;
}

.user-avatar {
  cursor: pointer;
}

.user-name {
  font-size: 14px;
  color: #606266;
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px; /* 增加头像和名称之间的间距 */
  cursor: pointer;
}

.layout-aside {
  background-color: #545c64;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
  overflow-y: auto;
}

.layout-main {
  padding: 20px;
  overflow-y: auto;
}

/* 当没有侧边栏时，调整主内容区宽度 */
.layout-main.without-aside {
  margin-left: 0;
  width: 100%;
}
</style>