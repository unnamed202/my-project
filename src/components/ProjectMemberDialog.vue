<template>
  <el-dialog
    v-model="visible"
    title="项目成员"
    width="500px"
    destroy-on-close
    @closed="onClose"
  >
    <div class="members-container">
      <!-- 成员列表 -->
      <div class="members-list" v-loading="loading">
        <div 
          v-for="member in members" 
          :key="member.id"
          class="member-item"
        >
          <!-- 用户头像和信息 -->
          <div class="member-info">
            <el-avatar size="small" class="member-avatar">
              {{ member.user_info?.full_name?.charAt(0) || '?' }}
            </el-avatar>
            <div class="member-details">
              <div class="member-name">{{ member.user_info?.full_name || member.user_info?.username }}</div>
              <div class="member-position">{{ member.position }}</div>
            </div>
          </div>
          
          <!-- 成员状态标签 -->
          <div class="member-status">
            <el-tag 
              v-if="member.permission_status === 'active'" 
              size="small" 
              type="success"
            >
              {{ member.user === currentProjectManager ? '项目负责人' : '有效' }}
            </el-tag>
            <el-tag 
              v-else-if="member.permission_status === 'inactive'" 
              size="small" 
              type="danger"
            >
              已禁用
            </el-tag>
            <el-tag 
              v-else-if="member.permission_status === 'pending'" 
              size="small" 
              type="warning"
            >
              待审批
            </el-tag>
            
            <!-- 临时权限过期提示 -->
            <div 
              v-if="isPermissionExpiringSoon(member)" 
              class="expiry-warning"
            >
              临时权限{{ getDaysUntilExpiry(member) }}天后过期
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="members.length === 0 && !loading" class="empty-state">
          <el-icon size="48" color="#909399"><User /></el-icon>
          <p>暂无项目成员</p>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleAddMember">
          <el-icon><Plus /></el-icon>添加新成员
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watchEffect } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Plus } from '@element-plus/icons-vue'
import { getProjectMembers } from '../api/projects'
import type { ProjectMember } from '../types/index'

// Props
const props = defineProps<{
  projectId: string
  projectManager: string
  visible: boolean
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'add-member'): void
  (e: 'close'): void
}>()

// 成员数据
const members = ref<ProjectMember[]>([])
const loading = ref(false)

// 计算当前项目负责人
const currentProjectManager = computed(() => props.projectManager)

// 判断权限是否即将过期
const isPermissionExpiringSoon = (member: ProjectMember): boolean => {
  if (!member.valid_to) return false
  
  const expiryDate = new Date(member.valid_to)
  const today = new Date()
  const diffTime = expiryDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays > 0 && diffDays <= 7 // 7天内过期
}

// 获取过期剩余天数
const getDaysUntilExpiry = (member: ProjectMember): number => {
  if (!member.valid_to) return 0
  
  const expiryDate = new Date(member.valid_to)
  const today = new Date()
  const diffTime = expiryDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays > 0 ? diffDays : 0
}

// 加载项目成员
const loadMembers = async () => {
  if (!props.projectId) return
  
  console.log('加载项目成员，projectId:', props.projectId)
  loading.value = true
  try {
    const response = await getProjectMembers(props.projectId)
    // 处理API响应，支持数组或分页响应格式
    members.value = Array.isArray(response) ? response : (response?.results || [])
    console.log('项目成员数据:', members.value)
  } catch (err: any) {
    console.error('获取项目成员失败:', err)
    ElMessage.error(err.message || '获取项目成员失败')
    members.value = []
  } finally {
    loading.value = false
  }
}

// 添加新成员
const handleAddMember = () => {
  emit('add-member')
}

// 关闭弹窗
const onClose = () => {
  emit('close')
  emit('update:visible', false)
}

// 监听弹窗显示状态
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 弹窗显示时加载数据
onMounted(() => {
  if (props.visible) {
    loadMembers()
  }
})

// 监听props变化重新加载数据
watchEffect(() => {
  if (props.visible) {
    loadMembers()
  }
})
</script>

<style scoped>
.members-container {
  max-height: 500px;
  overflow-y: auto;
}

.members-list {
  padding: 10px 0;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-avatar {
  background-color: #409EFF;
  color: white;
}

.member-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-name {
  font-weight: 500;
  font-size: 14px;
  color: #303133;
}

.member-position {
  font-size: 12px;
  color: #909399;
}

.member-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.expiry-warning {
  font-size: 12px;
  color: #F56C6C;
  margin-top: 2px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>