<template>
  <div class="project-groups-container">
    <!-- 顶部搜索和操作按钮 -->
    <div class="top-bar">
      <div class="left-section">
        <h2>项目组管理</h2>
      </div>
      <div class="right-section">
        <el-button type="primary" plain @click="handleAddMember">添加成员</el-button>
        <el-button type="primary" plain @click="handleBatchRemove">批量移除</el-button>
        <el-input
          v-model="searchMemberQuery"
          placeholder="搜索成员"
          class="search-member-input"
          clearable
        />
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧：项目树 -->
      <div class="left-panel">
        <el-input
          v-model="searchProjectQuery"
          placeholder="搜索部门、项目"
          class="search-project-input"
          clearable
        />
        <div class="project-tree">
          <el-tree
            :data="filteredProjects"
            :props="treeProps"
            :default-expand-all="true"
            :filter-node-method="filterNode"
            :highlight-current="true"
            @node-click="handleNodeClick"
            class="department-project-tree"
          >
            <template #default="{ node, data }">
              <span class="tree-node-content">
                {{ node.label }}
              </span>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右侧：项目成员列表 -->
      <div class="right-panel">
        <div class="panel-header">
          <h3>{{ selectedProject ? selectedProject.name : '请选择项目' }}</h3>
        </div>
        
        <el-table 
          v-if="selectedProject" 
          :data="filteredMembers" 
          style="width: 100%" 
          stripe 
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="user_info.full_name" label="用户名" width="120" />
          <el-table-column prop="position" label="岗位" width="100" />
          <el-table-column prop="user_info.last_login" label="最后操作时间" width="180" />
          <el-table-column label="角色" width="100">
            <template #default="scope">
              <el-tag 
                size="small" 
                :type="getRoleTagType(scope.row.position)"
              >
                {{ getRoleLabel(scope.row.position) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="权限状态" width="100">
            <template #default="scope">
              <el-tag 
                size="small" 
                :type="scope.row.permission_status === 'active' ? 'success' : 'danger'"
              >
                {{ scope.row.permission_status === 'active' ? '正常' : '已过期' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button size="small" type="primary" plain @click="handleView(scope.row)">查看</el-button>
              <el-button size="small" type="info" plain @click="handleEdit(scope.row)">编辑</el-button>
              <el-button size="small" type="warning" plain @click="handlePermission(scope.row)">权限管理</el-button>
              <el-button size="small" type="danger" plain @click="handleMoveProject(scope.row)">移除项目</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div v-else class="no-selection">
          <el-empty description="请选择项目" />
        </div>

        <!-- 分页 -->
        <div class="pagination" v-if="selectedProject">
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
      </div>
    </div>

    <!-- 添加成员对话框 -->
    <ProjectMembersDialog
      v-if="selectedProject"
      v-model:visible="addMemberDialogVisible"
      :project-id="selectedProject.id"
      :project-manager="selectedProject.manager"
      @add-member="handleAddNewMember"
    />
    
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDepartments } from './../api/team'
import { getProjects, getProjectMembers, removeProjectMember, batchRemoveProjectMembers } from './../api/projects'
import { getCurrentUser } from './../api/auth'
import type { Department, Project, ProjectMember, User } from './../types/index'
import ProjectMembersDialog from '../components/ProjectMembersDialog.vue'
import EditUserDialog from '../components/EditUserDialog.vue'

// 路由实例
const router = useRouter()

// 搜索条件
const searchProjectQuery = ref('')
const searchMemberQuery = ref('')

// 项目数据
const projects = ref<Project[]>([])
const departments = ref<Department[]>([])

// 当前用户信息
const currentUser = ref<User | null>(null)

// 选中的项目
const selectedProject = ref<Project | null>(null)

// 项目成员数据
const projectMembers = ref<ProjectMember[]>([])
const selectedMembers = ref<ProjectMember[]>([])

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)
const totalMembers = ref(0)

// 对话框显示状态
const addMemberDialogVisible = ref(false)
const editUserDialogVisible = ref(false)
const selectedUser = ref<User | null>(null)

// 加载当前用户信息
const loadCurrentUser = async () => {
  try {
    const user = await getCurrentUser()
    currentUser.value = user
  } catch (error) {
    console.error('加载当前用户信息失败:', error)
    ElMessage.error('加载用户信息失败，请重新登录')
  }
}

// 加载部门列表
const loadDepartments = async () => {
  try {
    const result = await getDepartments()
    departments.value = Array.isArray(result.results) ? result.results : result
  } catch (error) {
    console.error('加载部门列表失败:', error)
    ElMessage.error('加载部门列表失败')
  }
}

// 加载项目列表
const loadProjects = async () => {
  try {
    const result = await getProjects()
    projects.value = Array.isArray(result.results) ? result.results : result
  } catch (error) {
    console.error('加载项目列表失败:', error)
    ElMessage.error('加载项目列表失败')
  }
}

// 加载项目成员
const loadProjectMembers = async (projectId: string) => {
  try {
    const result = await getProjectMembers(projectId)
    projectMembers.value = Array.isArray(result.results) ? result.results : result
    totalMembers.value = projectMembers.value.length
  } catch (error) {
    console.error('加载项目成员失败:', error)
    ElMessage.error('加载项目成员失败')
  }
}

// 处理节点点击
const handleNodeClick = (data: any) => {
  if (data.type === 'project') {
    selectedProject.value = data as Project
    loadProjectMembers(data.id)
    currentPage.value = 1
  }
}

// 树结构属性配置
const treeProps = {
  children: 'children',
  label: 'name'
}

// 按部门组织的项目树数据
const departmentProjectTree = computed(() => {
  const tree: any[] = []
  
  // 按部门分组
  const projectsByDepartment: Record<string, Project[]> = {}
  
  projects.value.forEach(project => {
    if (!projectsByDepartment[project.department]) {
      projectsByDepartment[project.department] = []
    }
    projectsByDepartment[project.department].push(project)
  })
  
  // 构建树结构
  departments.value.forEach(department => {
    const departmentNode = {
      id: department.id,
      name: department.name,
      type: 'department',
      children: [] as any[]
    }
    
    // 添加该部门下的项目
    if (projectsByDepartment[department.id]) {
      departmentNode.children = projectsByDepartment[department.id].map(project => ({
        ...project,
        type: 'project'
      }))
    }
    
    tree.push(departmentNode)
  })
  
  return tree
})

// 过滤后的项目树数据
const filteredProjects = computed(() => {
  if (!searchProjectQuery.value) {
    return departmentProjectTree.value
  }
  return departmentProjectTree.value
})

// 树节点过滤方法
const filterNode = (value: string, data: any) => {
  if (!value) return true
  if (data.type === 'department') {
    // 部门节点：直接匹配部门名称
    return data.name.toLowerCase().includes(value.toLowerCase())
  } else if (data.type === 'project') {
    // 项目节点：匹配项目名称或所属部门名称
    const department = departments.value.find(dept => dept.id === data.department)
    return (
      data.name.toLowerCase().includes(value.toLowerCase()) ||
      (department && department.name.toLowerCase().includes(value.toLowerCase()))
    )
  }
  return true
}

// 过滤后的成员列表（用于搜索和分页）
const filteredMembers = computed(() => {
  let filtered = [...projectMembers.value]
  
  // 按成员搜索
  if (searchMemberQuery.value) {
    const query = searchMemberQuery.value.toLowerCase()
    filtered = filtered.filter(member => 
      member.user_info.full_name.toLowerCase().includes(query) ||
      member.user_info.username.toLowerCase().includes(query) ||
      member.position.toLowerCase().includes(query)
    )
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 处理成员选择
const handleSelectionChange = (selection: ProjectMember[]) => {
  selectedMembers.value = selection
}

// 处理添加成员
const handleAddMember = () => {
  if (!selectedProject) {
    ElMessage.warning('请先选择一个项目')
    return
  }
  addMemberDialogVisible.value = true
}

// 处理添加新成员
const handleAddNewMember = () => {
  // 这里可以实现添加新成员的逻辑
  ElMessage.info('添加新成员功能开发中')
}

// 处理批量移除
const handleBatchRemove = async () => {
  if (!selectedProject) {
    ElMessage.warning('请先选择一个项目')
    return
  }
  
  if (selectedMembers.value.length === 0) {
    ElMessage.warning('请选择要移除的成员')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要移除选中的${selectedMembers.value.length}个成员吗？`,
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const userIds = selectedMembers.value.map(member => member.user)
    await batchRemoveProjectMembers(selectedProject.id, userIds)
    
    ElMessage.success('批量移除成员成功')
    selectedMembers.value = []
    loadProjectMembers(selectedProject.id)
  } catch (error) {
    // 用户取消操作
    if ((error as any).name !== 'Cancel') {
      console.error('批量移除成员失败:', error)
      ElMessage.error('批量移除成员失败')
    }
  }
}

// 处理查看成员详情
const handleView = (member: ProjectMember) => {
  router.push(`/user/${member.user}`)
}

// 处理编辑成员
const handleEdit = (member: ProjectMember) => {
  selectedUser.value = member.user_info
  editUserDialogVisible.value = true
}

// 处理用户更新
const handleUserUpdated = (updatedUser: User) => {
  // 刷新成员列表
  if (selectedProject.value) {
    loadProjectMembers(selectedProject.value.id)
  }
  ElMessage.success('用户信息已更新')
}

// 处理权限管理
const handlePermission = (member: ProjectMember) => {
  console.log('权限管理:', member)
  ElMessage.info('权限管理功能开发中')
}

// 处理移除项目成员
const handleMoveProject = async (member: ProjectMember) => {
  if (!selectedProject) return
  
  try {
    await ElMessageBox.confirm(
      `确定要将${member.user_info.full_name}从项目中移除吗？`,
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await removeProjectMember(selectedProject.id, member.user)
    ElMessage.success('成员移除成功')
    loadProjectMembers(selectedProject.id)
  } catch (error) {
    // 用户取消操作
    if ((error as any).name !== 'Cancel') {
      console.error('移除成员失败:', error)
      ElMessage.error('移除成员失败')
    }
  }
}

// 获取角色标签类型
const getRoleTagType = (position: string) => {
  if (position.includes('超级管理员')) return 'danger'
  if (position.includes('负责人')) return 'success'
  if (position.includes('总监')) return 'warning'
  if (position.includes('工程师')) return 'info'
  return 'info'
}

// 获取角色标签名称
const getRoleLabel = (position: string) => {
  if (position.includes('超级管理员')) return '超级管理员'
  if (position.includes('负责人')) return '项目负责人'
  if (position.includes('总监')) return '部门负责人'
  return '普通成员'
}

// 监听搜索项目查询变化
watch(searchProjectQuery, (newVal) => {
  // 实现搜索逻辑
})

// 组件挂载时加载数据
onMounted(async () => {
  await Promise.all([
    loadDepartments(),
    loadProjects(),
    loadCurrentUser()
  ])
})
</script>

<style scoped>
.project-groups-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.left-section h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-member-input {
  width: 200px;
}

.main-content {
  display: flex;
  flex: 1;
  gap: 20px;
  overflow: hidden;
}

.left-panel {
  width: 300px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-project-input {
  margin: 10px;
  width: calc(100% - 20px);
}

.project-tree {
  flex: 1;
  overflow-y: auto;
}

.department-project-tree {
  height: 100%;
}

.tree-node-content {
  font-size: 14px;
  color: #303133;
}

.right-panel {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 10px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.no-selection {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.pagination {
  margin-top: 20px;
  padding: 0 20px 20px;
  display: flex;
  justify-content: center;
}
</style>