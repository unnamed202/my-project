<template>
  <div class="user-detail-container">
    <!-- 页面标题和返回按钮 -->
    <div class="page-header">
      <el-button type="primary" plain @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回上一页
      </el-button>
      <h2>用户详情</h2>
      <div class="header-actions">
        <el-button type="success" plain @click="handleEdit">
          <el-icon><Edit /></el-icon> 编辑
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <el-skeleton :loading="loading" animated>
      <!-- 用户基本信息卡片 -->
      <el-card class="user-info-card">
        <template #header>
          <div class="card-header">
            <h3>基本信息</h3>
          </div>
        </template>

        <div class="user-info-content">
          <!-- 用户头像 -->
          <div class="user-avatar">
            <el-avatar :size="100" :src="userAvatar">
              {{ userInfo.full_name ? userInfo.full_name.charAt(0) : '?' }}
            </el-avatar>
          </div>

          <!-- 用户基本信息 - 两栏布局 -->
          <div class="user-info">
            <div class="info-row">
              <span class="label">姓名：</span>
              <span class="value">{{ userInfo.full_name }}</span>
            </div>
            <div class="info-row">
              <span class="label">用户名：</span>
              <span class="value">{{ userInfo.username }}</span>
            </div>
            <div class="info-row">
              <span class="label">部门：</span>
              <span class="value">{{ userInfo.department_name }}</span>
            </div>
            <div class="info-row">
              <span class="label">岗位：</span>
              <span class="value">{{ userInfo.position }}</span>
            </div>
            <div class="info-row">
              <span class="label">角色：</span>
              <el-tag
                :type="userInfo.role === 'super_admin' ? 'danger' : 
                       userInfo.role === 'general_manager' ? 'warning' :
                       userInfo.role === 'dept_manager' ? 'success' : 'info'"
                class="role-tag"
              >
                {{ roleLabelMap[userInfo.role] || userInfo.role }}
              </el-tag>
            </div>
            <div class="info-row">
              <span class="label">邮箱：</span>
              <span class="value">{{ userInfo.email }}</span>
            </div>
            <div class="info-row">
              <span class="label">电话：</span>
              <span class="value">{{ userInfo.phone }}</span>
            </div>
            <div class="info-row">
              <span class="label">性别：</span>
              <span class="value">{{ genderLabelMap[userInfo.gender] || userInfo.gender }}</span>
            </div>
            <div class="info-row">
              <span class="label">状态：</span>
              <el-tag
                :type="userInfo.is_active ? 'success' : 'danger'"
                class="status-tag"
              >
                {{ userInfo.is_active ? '正常' : '已过期' }}
              </el-tag>
            </div>
            <div class="info-row">
              <span class="label">加入时间：</span>
              <span class="value">{{ formatDate(userInfo.date_joined) }}</span>
            </div>
            <div class="info-row">
              <span class="label">最后登录：</span>
              <span class="value">{{ formatDate(userInfo.last_login) }}</span>
            </div>
          </div>
        </div>
      </el-card>


    </el-skeleton>

    <!-- 编辑用户对话框 -->
    <EditUserDialog
      v-model:visible="editUserDialogVisible"
      :user-data="userInfo"
      :is-edit="true"
      @user-updated="handleUserUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Edit } from '@element-plus/icons-vue'
import type { User } from '../types/index'
import { getUserById } from '../api/team'
import { ElMessage } from 'element-plus'
import EditUserDialog from '../components/EditUserDialog.vue'

// 路由相关
const route = useRoute()
const router = useRouter()

// 用户ID
const userId = computed(() => route.params.id as string)

// 加载状态
const loading = ref(true)

// 用户信息
const userInfo = ref<User>({
  id: '',
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  full_name: '',
  phone: '',
  gender: 'male',
  position: '',
  department: '',
  department_name: '',
  role: 'employee',
  is_active: true,
  date_joined: '',
  last_login: ''
})

// 用户头像
const userAvatar = ref('')

// 编辑用户对话框相关数据
const editUserDialogVisible = ref(false)

// 角色标签映射
const roleLabelMap = {
  super_admin: '超级管理员',
  general_manager: '总经理',
  dept_manager: '部门经理',
  employee: '普通员工'
}

// 性别标签映射
const genderLabelMap = {
  male: '男',
  female: '女',
  other: '其他'
}

// 加载用户数据
const loadUserData = async () => {
  try {
    loading.value = true
    const user = await getUserById(userId.value)
    if (user) {
      userInfo.value = user
      // 如果有用户头像，设置头像URL
      // userAvatar.value = user.avatar || ''
    } else {
      ElMessage.error('未找到该用户信息')
      goBack()
    }
  } catch (error: any) {
    console.error('加载用户数据失败:', error)
    if (error.response && error.response.status === 404) {
      ElMessage.error('未找到该用户')
    } else if (error.response && error.response.status === 403) {
      ElMessage.error('您没有权限查看该用户信息')
    } else {
      ElMessage.error('加载用户数据失败，请重试')
    }
    goBack()
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString()
}



// 处理编辑按钮点击
const handleEdit = () => {
  editUserDialogVisible.value = true
}

// 处理用户更新
const handleUserUpdated = (updatedUser: User) => {
  // 更新用户信息
  userInfo.value = updatedUser
  ElMessage.success('用户信息已更新')
}

// 页面加载时获取用户数据
onMounted(() => {
  loadUserData()
})
</script>

<style scoped>
.user-detail-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 页面标题和返回按钮 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 0 20px;
  font-size: 20px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* 用户信息卡片 */
.user-info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.user-info-content {
  display: flex;
  align-items: flex-start;
  padding: 20px 0;
}

.user-avatar {
  margin-right: 40px;
}

.user-info {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px 30px;
}

.info-row {
  display: flex;
  align-items: center;
}

/* 确保第一行的姓名和用户名占据整个宽度 */
.info-row:nth-child(1),
.info-row:nth-child(2) {
  grid-column: span 2;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  width: 100px;
  font-weight: bold;
  color: #606266;
}

.value {
  color: #303133;
}

.role-tag, .status-tag {
  margin-left: 8px;
}


</style>