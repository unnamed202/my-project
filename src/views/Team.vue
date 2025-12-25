<template>
  <div class="team-container">
    <!-- 顶部选择器和搜索 -->
    <div class="top-bar">
      <el-select v-model="selectedDepartment" placeholder="选择部门" class="department-select" @change="handleDepartmentChange" filterable>
        <!-- 所有角色都能看到"全部部门"选项，但只有有权限的用户才能查看数据 -->
        <el-option 
          label="全部部门" 
          value=""
        />
        <el-option
          v-for="department in departments"
          :key="department?.id || 'default'"
          :label="department?.name || ''"
          :value="department?.id || ''"
        />
      </el-select>
      <el-input
        v-model="searchQuery"
        placeholder="搜索成员"
        class="search-input"
        clearable
        @input="handleSearch"
      />
    </div>

    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <h2>成员管理</h2>
      <div class="header-buttons">
        <el-button type="primary" plain>添加至项目组</el-button>
        <el-button type="primary" @click="openAddMemberDialog">添加成员至部门</el-button>
      </div>
    </div>

    <!-- 添加成员对话框 -->
    <el-dialog
      v-model="addMemberDialogVisible"
      title="添加已存在用户到部门"
      width="600px"
      @close="resetAddMemberForm"
    >
      <el-form
        ref="addMemberFormRef"
        :model="addMemberForm"
        :rules="addMemberFormRules"
        label-width="120px"
        class="add-member-form"
      >
        <el-form-item label="选择用户" prop="selectedUsers">
          <el-select
            v-model="addMemberForm.selectedUsers"
            placeholder="请选择要添加的用户"
            multiple
            filterable
            remote
            :remote-method="loadAvailableUsers"
            :loading="loadingUsers"
            style="width: 100%"
          >
            <el-option
              v-for="user in availableUsers"
              :key="user.id"
              :label="`${user.full_name} (${user.username})`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="目标部门" prop="department">
          <el-select v-model="addMemberForm.department" placeholder="请选择部门" style="width: 100%">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addMemberDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAddMember">提交</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 成员列表表格 -->
    <el-table :data="filteredMembers" style="width: 100%" stripe :row-height="30" @cell-mouse-enter="handleCellMouseEnter" @cell-mouse-leave="handleCellMouseLeave">
      <!-- 操作按钮行级显示 -->
      <el-table-column label="" width="1" fixed="right">
        <template #default="scope">
          <div class="action-buttons" :class="{ 'visible': hoveredRowId === scope.row.id }">
            <el-button size="small" type="primary" plain @click="handleView(scope.row)">查看</el-button>
            <el-button size="small" type="success" plain @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="warning" plain @click="handleAdjustProjects(scope.row)">调整参与项目</el-button>
            <el-button size="small" type="danger" plain @click="handleRemoveTeam(scope.row)">移除团队</el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column type="selection" width="45" />
      <el-table-column prop="username" label="用户名" width="80" />
      <el-table-column prop="full_name" label="姓名" width="80" />
      <el-table-column prop="position" label="岗位" width="80" />
      <el-table-column label="所属项目组" min-width="120">
        <template #default="scope">
          <span v-if="scope.row.projects && scope.row.projects.length > 0">
            {{ scope.row.projects.join('、') }}
          </span>
          <span v-else class="text-gray">未分组</span>
        </template>
      </el-table-column>
      <el-table-column prop="last_login" label="最后操作时间" width="120" />
      <el-table-column label="角色" width="90">
        <template #default="scope">
          <el-tag
            size="small"
            :type="scope.row.role === 'super_admin' ? 'danger' : 
                   scope.row.role === 'general_manager' ? 'warning' :
                   scope.row.role === 'dept_manager' ? 'success' : 'info'"
          >
            {{ scope.row.role }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="权限状态" width="80">
        <template #default="scope">
          <el-tag
            size="small"
            :type="scope.row.is_active ? 'success' : 'danger'"
          >
            {{ scope.row.is_active ? '正常' : '已过期' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_by_name" label="创建人" width="80">
        <template #default="scope">
          <span>{{ scope.row.created_by_name }}</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalMembers"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 编辑用户对话框 -->
    <EditUserDialog
      v-model:visible="editUserDialogVisible"
      :user-data="selectedUser"
      :is-edit="true"
      @user-updated="handleUserUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { User, Department } from '../types/index'// 引入API
import { getDepartments, getUsers, getDepartmentMembers, addUsersToDepartment, removeUserFromDepartment } from '../api/team'
import { getCurrentUser } from '../api/auth'
import { ElMessage } from 'element-plus'
import EditUserDialog from '../components/EditUserDialog.vue'

// 部门数据
const departments = ref<Department[]>([])
const selectedDepartment = ref('')

// 成员数据
const members = ref<User[]>([])
const searchQuery = ref('')

// 当前用户信息
const currentUser = ref<User | null>(null)

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)
const totalMembers = ref(0)

// 加载部门列表
const loadDepartments = async () => {
  try {
    const result = await getDepartments()
    // 处理可能的分页响应格式（与projects API相同）
    const departmentArray = result.results ? result.results : result
    // 确保返回的数据是数组，并过滤掉可能的null值
    departments.value = Array.isArray(departmentArray) ? departmentArray.filter(dept => dept !== null) : []
  } catch (error) {
    console.error('加载部门列表失败:', error)
    // 清空数据以显示No Data
    departments.value = []
  }
}

// 加载当前用户信息
const loadCurrentUser = async () => {
  try {
    const user = await getCurrentUser()
    currentUser.value = user
    console.log('当前用户信息:', user)
  } catch (error) {
    console.error('加载当前用户信息失败:', error)
    ElMessage.error('加载用户信息失败，请重新登录')
  }
}

// 加载成员列表
const loadMembers = async () => {
  try {
    let membersData: User[] = []
    
    // 根据用户角色和选择的部门来调用不同的API
    if (selectedDepartment.value) {
      // 获取指定部门的成员
      const result = await getDepartmentMembers(selectedDepartment.value)
      // 处理可能的分页响应格式（与projects API相同）
      const memberArray = result.results ? result.results : result
      // 确保返回的数据是数组
      membersData = Array.isArray(memberArray) ? memberArray : []
    } else {
      // 没有选择具体部门时
      if (currentUser.value?.role === 'super_admin' || currentUser.value?.role === 'general_manager') {
        // 超级管理员和总经理可以查看所有成员
        const params = {
          search: searchQuery.value || undefined
        }
        const result = await getUsers(params)
        // 处理可能的分页响应格式（与projects API相同）
        const memberArray = result.results ? result.results : result
        // 确保返回的数据是数组
        membersData = Array.isArray(memberArray) ? memberArray : []
      } else if (currentUser.value?.department) {
        // 其他角色默认查看自己部门的成员
        const result = await getDepartmentMembers(currentUser.value.department)
        // 处理可能的分页响应格式（与projects API相同）
        const memberArray = result.results ? result.results : result
        // 确保返回的数据是数组
        membersData = Array.isArray(memberArray) ? memberArray : []
      }
      
      if (membersData.length === 0) {
        // 成员列表为空时的提示
        ElMessage.info('当前部门暂无成员')
      }
    }
    
    // 如果有搜索关键词，进一步过滤
    if (searchQuery.value && membersData.length > 0) {
      const keyword = searchQuery.value.toLowerCase()
      membersData = membersData.filter(member => 
        member.username.toLowerCase().includes(keyword) ||
        (member.full_name && member.full_name.toLowerCase().includes(keyword))
      )
    }
    
    members.value = membersData
    totalMembers.value = membersData.length
  } catch (error: any) {
    console.error('加载成员列表失败:', error)
    // 清空数据以显示No Data
    members.value = []
    totalMembers.value = 0
    
    // 根据错误类型显示不同的提示
    if (error.response && error.response.status === 403) {
      ElMessage.error('您没有权限查看该部门的成员')
    } else if (error.response && error.response.status === 404) {
      ElMessage.error('未找到该部门的成员信息')
    } else {
      ElMessage.error('加载成员列表失败，请检查网络连接或联系管理员')
    }
  }
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  loadMembers()
}

// 处理部门选择
const handleDepartmentChange = () => {
  currentPage.value = 1
  loadMembers()
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 过滤后的成员数据（用于分页）
const filteredMembers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  // 确保members.value是一个数组
  return Array.isArray(members.value) ? members.value.slice(start, end) : []
})



// 添加成员相关数据
const addMemberDialogVisible = ref(false)
const addMemberFormRef = ref()
const addMemberForm = ref({
  selectedUsers: [] as string[], // 选中的用户ID列表
  department: '' // 目标部门ID
})

// 可用用户列表（系统中已存在的用户）
const availableUsers = ref<User[]>([])
const loadingUsers = ref(false)

// 添加成员表单验证规则
const addMemberFormRules = ref({
  selectedUsers: [
    { required: true, message: '请选择要添加的用户', trigger: 'change' },
    { type: 'array', min: 1, message: '至少选择一个用户', trigger: 'change' }
  ],
  department: [
    { required: true, message: '请选择目标部门', trigger: 'change' }
  ]
})

// 加载可用用户（排除已在当前部门的用户）
const loadAvailableUsers = async (query?: string) => {
  try {
    loadingUsers.value = true
    // 获取所有用户
    const result = await getUsers({ search: query || undefined })
    const allUsers = result.results ? result.results : result
    
    // 如果当前已选择部门，获取该部门的现有成员
    let existingUserIds = []
    if (addMemberForm.value.department) {
      const deptMembersResult = await getDepartmentMembers(addMemberForm.value.department)
      const deptMembers = deptMembersResult.results ? deptMembersResult.results : deptMembersResult
      existingUserIds = deptMembers.map(member => member.id)
    }
    
    // 过滤掉已在目标部门的用户
    availableUsers.value = allUsers.filter(user => !existingUserIds.includes(user.id))
  } catch (error) {
    console.error('加载可用用户失败:', error)
    ElMessage.error('加载可用用户失败')
  } finally {
    loadingUsers.value = false
  }
}

// 打开添加成员对话框
const openAddMemberDialog = () => {
  // 默认选择当前选中的部门
  if (selectedDepartment.value) {
    addMemberForm.value.department = selectedDepartment.value
    // 加载该部门下可添加的用户
    loadAvailableUsers()
  }
  addMemberDialogVisible.value = true
}

// 重置添加成员表单
const resetAddMemberForm = () => {
  if (addMemberFormRef.value) {
    addMemberFormRef.value.resetFields()
  }
  // 保留默认部门选择
  if (selectedDepartment.value) {
    addMemberForm.value.department = selectedDepartment.value
  }
  // 清空用户列表
  availableUsers.value = []
}

// 处理添加成员
const handleAddMember = async () => {
  if (!addMemberFormRef.value) return
  
  try {
    await addMemberFormRef.value.validate()
    
    // 添加用户到部门
    await addUsersToDepartment(addMemberForm.value.department, addMemberForm.value.selectedUsers)
    ElMessage.success(`成功添加${addMemberForm.value.selectedUsers.length}个用户到部门`)
    
    // 关闭对话框
    addMemberDialogVisible.value = false
    
    // 刷新成员列表
    loadMembers()
  } catch (error: any) {
    console.error('添加用户到部门失败:', error)
    if (error.response && error.response.data) {
      ElMessage.error(`添加用户到部门失败: ${JSON.stringify(error.response.data)}`)
    } else {
      ElMessage.error('添加用户到部门失败，请重试')
    }
  }
}

// 编辑用户对话框相关数据
const editUserDialogVisible = ref(false)
const selectedUser = ref<User | null>(null)

// 鼠标悬浮行ID用于控制操作按钮显示
const hoveredRowId = ref<string>('')

// 处理表格行鼠标进入事件
const handleCellMouseEnter = (row: User) => {
  hoveredRowId.value = row.id
}

// 处理表格行鼠标离开事件
const handleCellMouseLeave = () => {
  hoveredRowId.value = ''
}

// 操作方法
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

const handleView = (user: User) => {
  router.push(`/user/${user.id}`)
}

const handleEdit = (user: User) => {
  selectedUser.value = user
  editUserDialogVisible.value = true
}

const handleAdjustProjects = (user: User) => {
  console.log('调整参与项目:', user)
}

const handleRemoveTeam = async (user: User) => {
  try {
    // 权限检查：普通员工无权限
    if (currentUser.value?.role === 'employee') {
      ElMessage.error('您没有权限执行此操作')
      return
    }
    
    // 部门管理员只能移除本部门成员
    if (currentUser.value?.role === 'dept_manager' && currentUser.value.department !== user.department) {
      ElMessage.error('您只能移除本部门的成员')
      return
    }
    
    // 确认对话框
    await ElMessageBox.confirm(
      `确定要将${user.full_name}从部门中移除吗？`,
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用API移除成员
    await removeUserFromDepartment(user.department, user.id)
    
    ElMessage.success('成员移除成功')
    
    // 刷新成员列表
    loadMembers()
    
  } catch (error: any) {
    console.error('移除成员失败:', error)
    
    // 如果用户取消操作，不显示错误信息
    if (error.name !== 'Cancel') {
      if (error.response && error.response.status === 403) {
        ElMessage.error('您没有权限执行此操作')
      } else if (error.response && error.response.status === 404) {
        ElMessage.error('用户不在该部门')
      } else {
        ElMessage.error('移除成员失败，请重试')
      }
    }
  }
}

// 处理用户更新
const handleUserUpdated = (updatedUser: User) => {
  // 刷新成员列表
  loadMembers()
  ElMessage.success('用户信息已更新')
}

// 生命周期钩子
onMounted(async () => {
  await Promise.all([
    loadDepartments(),
    loadCurrentUser()
  ])
  
  // 根据用户角色设置默认选择的部门
  if (currentUser.value) {
    if (currentUser.value.role === 'super_admin' || currentUser.value.role === 'general_manager') {
      // 超级管理员和总经理默认选择全部部门
      selectedDepartment.value = ''
      console.log('总经理/超级管理员默认显示全部部门')
    } else if (currentUser.value.department) {
      // 其他角色默认选择自己所属的部门
      selectedDepartment.value = currentUser.value.department
      console.log('自动选择部门ID:', selectedDepartment.value)
    } else {
      // 如果没有所属部门
      selectedDepartment.value = ''
      ElMessage.warning('您目前没有所属部门，无法查看成员信息')
    }
    // 加载成员数据
    loadMembers()
  } else {
    // 没有获取到用户信息
    members.value = []
    totalMembers.value = 0
    ElMessage.error('无法获取用户信息，请重新登录')
  }
})
</script>

<style scoped>
.team-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 顶部选择器和搜索栏 */
.top-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.department-select {
  width: 200px;
  margin-right: 20px;
}

/* 调整表格行高和样式 */
:deep(.el-table__row) {
  line-height: 30px;
}

.search-input {
  width: 300px;
}

/* 页面标题和操作按钮 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

/* 表格样式 */
:deep(.el-table__header-wrapper) {
  background-color: #fafafa;
}

:deep(.el-table__header th) {
  font-weight: bold;
  color: #303133;
}

.text-gray {
  color: #909399;
}

/* 分页样式 */
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 操作按钮组 */
.action-buttons {
  opacity: 0;
  visibility: hidden;
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(255, 255, 255, 0.95);
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  z-index: 1000; /* 提高z-index确保遮挡表格内容 */
  display: flex;
  gap: 4px;
  white-space: nowrap;
}

.action-buttons.visible {
  opacity: 1;
  visibility: visible;
}

/* 调整表格单元格内边距 */
:deep(.el-table__cell) {
  padding: 2px 8px !important;
  position: relative;
}

/* 确保表格行可以被相对定位 */
:deep(.el-table__row) {
  position: relative;
}

/* 表格行hover效果 */
:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>