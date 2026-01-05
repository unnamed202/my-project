<template>
  <div class="team-settings-container">
    <h2>团队设置</h2>
    
    <!-- 权限检查 -->
    <template v-if="currentUser?.role === 'general_manager'">
      <!-- 移交团队 -->
      <div class="setting-card">
        <h3>移交团队</h3>
        <p>将团队的管理权限移交给其他成员。</p>
        <el-button type="primary" @click="openTransferDialog">移交团队</el-button>
      </div>
      
      <!-- 合并团队 -->
      <div class="setting-card">
        <h3>合并团队</h3>
        <p>将两个团队合并为一个，保留目标团队的信息。</p>
        <el-button type="primary" @click="openMergeDialog">合并团队</el-button>
      </div>
      
      <!-- 解散团队 -->
      <div class="setting-card">
        <h3>解散团队</h3>
        <p>解散现有团队，需将团队成员转移到其他团队。</p>
        <el-button type="danger" @click="openDissolveDialog">解散团队</el-button>
      </div>
    </template>
    
    <template v-else>
      <div class="no-permission">
        <el-alert
          title="权限不足"
          type="warning"
          description="只有总经理可以进行团队设置操作"
          show-icon
        />
      </div>
    </template>
    
    <!-- 移交团队对话框 -->
    <el-dialog
      v-model="transferDialogVisible"
      title="移交团队"
      width="500px"
    >
      <el-form :model="transferForm" :rules="transferRules" ref="transferFormRef">
        <el-form-item label="选择团队" prop="departmentId">
          <el-select v-model="transferForm.departmentId" placeholder="请选择团队">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="新负责人" prop="newManagerId">
          <el-select v-model="transferForm.newManagerId" placeholder="请选择新负责人">
            <el-option
              v-for="user in managers"
              :key="user.id"
              :label="user.full_name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="transferDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleTransfer">确认移交</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 合并团队对话框 -->
    <el-dialog
      v-model="mergeDialogVisible"
      title="合并团队"
      width="500px"
    >
      <el-form :model="mergeForm" :rules="mergeRules" ref="mergeFormRef">
        <el-form-item label="源团队" prop="sourceDepartmentIds">
          <el-select v-model="mergeForm.sourceDepartmentIds" placeholder="请选择要合并的团队" multiple>
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="新部门名称" prop="targetDepartmentName">
          <el-input v-model="mergeForm.targetDepartmentName" placeholder="请输入合并后的新部门名称" />
        </el-form-item>
        
        <el-form-item label="新部门编号" prop="targetDepartmentCode">
          <el-input v-model="mergeForm.targetDepartmentCode" placeholder="请输入合并后的新部门编号" />
        </el-form-item>
        
        <el-form-item label="新部门负责人" prop="managerId">
          <el-select v-model="mergeForm.managerId" placeholder="请选择新部门负责人">
            <el-option
              v-for="user in managers"
              :key="user.id"
              :label="user.full_name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="mergeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleMerge">确认合并</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 解散团队对话框 -->
    <el-dialog
      v-model="dissolveDialogVisible"
      title="解散团队"
      width="500px"
    >
      <el-form :model="dissolveForm" :rules="dissolveRules" ref="dissolveFormRef">
        <el-form-item label="选择团队" prop="departmentId">
          <el-select v-model="dissolveForm.departmentId" placeholder="请选择要解散的团队">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="转移成员到" prop="targetDepartmentId">
          <el-select v-model="dissolveForm.targetDepartmentId" placeholder="请选择成员转移的目标团队">
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
          <el-button @click="dissolveDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="handleDissolve">确认解散</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { getDepartments, transferTeam, mergeTeams, dissolveTeam, getUsers } from '../api/team'
import { getCurrentUser } from '../api/auth'
import type { User, Department } from '../types/index'

// 当前用户信息
const currentUser = ref<User | null>(null)

// 部门列表
const departments = ref<Department[]>([])

// 管理员列表
const managers = ref<User[]>([])

// 对话框显示状态
const transferDialogVisible = ref(false)
const mergeDialogVisible = ref(false)
const dissolveDialogVisible = ref(false)

// 表单引用
const transferFormRef = ref<FormInstance>()
const mergeFormRef = ref<FormInstance>()
const dissolveFormRef = ref<FormInstance>()

// 表单数据
const transferForm = reactive({
  departmentId: '',
  newManagerId: ''
})

const mergeForm = reactive({
  sourceDepartmentIds: [] as string[],
  targetDepartmentName: '',
  targetDepartmentCode: '',
  managerId: ''
})

const dissolveForm = reactive({
  departmentId: '',
  targetDepartmentId: ''
})

// 表单验证规则
const transferRules = reactive({
  departmentId: [{ required: true, message: '请选择团队', trigger: 'change' }],
  newManagerId: [{ required: true, message: '请选择新负责人', trigger: 'change' }]
})

const mergeRules = reactive({
  sourceDepartmentIds: [
    { required: true, message: '请选择源团队', trigger: 'change' },
    { type: 'array', min: 2, message: '请至少选择两个源团队', trigger: 'change' }
  ],
  targetDepartmentName: [
    { required: true, message: '请输入新部门名称', trigger: 'blur' },
    { min: 1, max: 50, message: '部门名称长度在1到50个字符', trigger: 'blur' }
  ],
  targetDepartmentCode: [
    { required: true, message: '请输入新部门编号', trigger: 'blur' },
    { min: 1, max: 20, message: '部门编号长度在1到20个字符', trigger: 'blur' }
  ],
  managerId: [
    { required: true, message: '请选择新部门负责人', trigger: 'change' }
  ]
})

const dissolveRules = reactive({
  departmentId: [{ required: true, message: '请选择要解散的团队', trigger: 'change' }],
  targetDepartmentId: [
    { required: true, message: '请选择成员转移的目标团队', trigger: 'change' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value === dissolveForm.departmentId) {
          callback(new Error('目标团队不能是要解散的团队'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
})

// 打开移交团队对话框
const openTransferDialog = () => {
  transferDialogVisible.value = true
}

// 打开合并团队对话框
const openMergeDialog = () => {
  mergeDialogVisible.value = true
}

// 打开解散团队对话框
const openDissolveDialog = () => {
  dissolveDialogVisible.value = true
}

// 处理移交团队
const handleTransfer = async () => {
  if (!transferFormRef.value) return
  
  await transferFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await transferTeam(transferForm.departmentId, transferForm.newManagerId)
        ElMessage.success('团队移交成功')
        transferDialogVisible.value = false
        // 重置表单
        transferFormRef.value?.resetFields()
        // 重新加载数据
        await loadData()
      } catch (error) {
        ElMessage.error('团队移交失败')
        console.error('Transfer team error:', error)
      }
    }
  })
}

// 处理合并团队
const handleMerge = async () => {
  if (!mergeFormRef.value) return
  
  await mergeFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await ElMessageBox.confirm(
          `确定要合并这${mergeForm.sourceDepartmentIds.length}个团队吗？将创建一个新的部门`,
          '合并确认',
          { type: 'warning' }
        )
        
        // 调用合并团队API
        await mergeTeams({
          source_department_ids: mergeForm.sourceDepartmentIds,
          target_department_name: mergeForm.targetDepartmentName,
          target_department_code: mergeForm.targetDepartmentCode,
          manager_id: mergeForm.managerId
        })
        
        ElMessage.success('团队合并成功')
        mergeDialogVisible.value = false
        // 重置表单
        mergeFormRef.value?.resetFields()
        // 重新加载数据
        await loadData()
      } catch (error: any) {
        if (error.name !== 'Cancel') {
          ElMessage.error('团队合并失败')
          console.error('Merge teams error:', error)
        }
      }
    }
  })
}

// 处理解散团队
const handleDissolve = async () => {
  if (!dissolveFormRef.value) return
  
  await dissolveFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await ElMessageBox.confirm(
          '确定要解散该团队吗？团队成员将被转移到目标团队',
          '解散确认',
          { type: 'error' }
        )
        
        await dissolveTeam(dissolveForm.departmentId)
        ElMessage.success('团队解散成功')
        dissolveDialogVisible.value = false
        // 重置表单
        dissolveFormRef.value?.resetFields()
        // 重新加载数据
        await loadData()
      } catch (error: any) {
        if (error.name !== 'Cancel') {
          ElMessage.error('团队解散失败')
          console.error('Dissolve team error:', error)
        }
      }
    }
  })
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

// 加载数据
const loadData = async () => {
  try {
    // 加载部门列表
    const deptResponse = await getDepartments()
    departments.value = deptResponse.results
    
    // 加载管理员列表（部门经理及以上角色）
    const usersResponse = await getUsers({ role: 'dept_manager' })
    managers.value = usersResponse.results
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error('Load data error:', error)
  }
}

// 页面加载时初始化数据
onMounted(async () => {
  await loadCurrentUser()
  await loadData()
})
</script>

<style scoped>
.team-settings-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 120px);
}

h2 {
  font-size: 24px;
  margin-bottom: 20px;
  color: #303133;
}

.setting-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.setting-card h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #303133;
}

.setting-card p {
  margin-bottom: 20px;
  color: #606266;
  line-height: 1.5;
}

.no-permission {
  text-align: center;
  padding: 50px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>