<template>
  <el-dialog
    v-model="visibleRef"
    :title="isEdit ? '编辑用户信息' : '添加用户信息'"
    width="600px"
    @close="resetForm"
  >
    <el-form
      ref="editUserFormRef"
      :model="editUserForm"
      :rules="editUserFormRules"
      label-width="120px"
      class="edit-user-form"
    >
      <!-- 用户基本信息 -->
      <el-form-item label="用户名" prop="username">
        <el-input
          v-model="editUserForm.username"
          placeholder="请输入用户名"
          disabled
        />
      </el-form-item>

      <el-form-item label="邮箱" prop="email">
        <el-input
          v-model="editUserForm.email"
          placeholder="请输入邮箱"
          type="email"
        />
      </el-form-item>

      <el-form-item label="姓" prop="first_name">
        <el-input
          v-model="editUserForm.first_name"
          placeholder="请输入姓"
        />
      </el-form-item>

      <el-form-item label="名" prop="last_name">
        <el-input
          v-model="editUserForm.last_name"
          placeholder="请输入名"
        />
      </el-form-item>

      <el-form-item label="电话" prop="phone">
        <el-input
          v-model="editUserForm.phone"
          placeholder="请输入电话"
        />
      </el-form-item>

      <el-form-item label="性别" prop="gender">
        <el-select
          v-model="editUserForm.gender"
          placeholder="请选择性别"
        >
          <el-option label="男" value="male" />
          <el-option label="女" value="female" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>

      <el-form-item label="岗位" prop="position">
        <el-input
          v-model="editUserForm.position"
          placeholder="请输入岗位"
        />
      </el-form-item>

      <el-form-item label="部门" prop="department">
        <el-select
          v-model="editUserForm.department"
          placeholder="请选择部门"
        >
          <el-option
            v-for="dept in departments"
            :key="dept.id"
            :label="dept.name"
            :value="dept.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="角色" prop="role">
        <el-select
          v-model="editUserForm.role"
          placeholder="请选择角色"
        >
          <el-option label="超级管理员" value="super_admin" />
          <el-option label="总经理" value="general_manager" />
          <el-option label="部门经理" value="dept_manager" />
          <el-option label="普通员工" value="employee" />
        </el-select>
      </el-form-item>

      <el-form-item label="状态" prop="is_active">
        <el-switch v-model="editUserForm.is_active" />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="resetForm">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import type { FormInstance } from 'element-plus'
import type { User, Department } from '../types/index'
import { getDepartments, updateUser } from '../api/team'
import { ElMessage } from 'element-plus'

// Props
const props = defineProps<{
  visible: boolean
  userData?: User
  isEdit?: boolean
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'user-updated', user: User): void
}>()

// 本地visible状态，用于v-model绑定
const visibleRef = ref(props.visible)

// 表单引用
const editUserFormRef = ref<FormInstance | null>(null)

// 部门数据
const departments = ref<Department[]>([])

// 编辑用户表单数据
const editUserForm = reactive<User>({
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

// 表单验证规则
const editUserFormRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'change' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  first_name: [
    { required: true, message: '请输入姓', trigger: 'blur' }
  ],
  last_name: [
    { required: true, message: '请输入名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入电话', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  position: [
    { required: true, message: '请输入岗位', trigger: 'blur' }
  ],
  department: [
    { required: true, message: '请选择部门', trigger: 'change' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
})

// 加载部门数据
const loadDepartments = async () => {
  try {
    const result = await getDepartments()
    const departmentArray = result.results ? result.results : result
    departments.value = Array.isArray(departmentArray) ? departmentArray.filter(dept => dept !== null) : []
  } catch (error) {
    console.error('加载部门列表失败:', error)
    ElMessage.error('加载部门列表失败')
  }
}

// 重置表单
const resetForm = () => {
  if (editUserFormRef.value) {
    editUserFormRef.value.resetFields()
  }
  emit('update:visible', false)
}

// 保存用户信息
const handleSubmit = async () => {
  if (!editUserFormRef.value) return
  
  try {
    await editUserFormRef.value.validate()
    
    // 更新用户信息
    const updatedUser = await updateUser(editUserForm.id, editUserForm)
    ElMessage.success('用户信息更新成功')
    
    // 关闭对话框
    emit('update:visible', false)
    
    // 通知父组件用户信息已更新
    emit('user-updated', updatedUser)
  } catch (error: any) {
    console.error('更新用户信息失败:', error)
    if (error.response && error.response.data) {
      ElMessage.error(`更新用户信息失败: ${JSON.stringify(error.response.data)}`)
    } else {
      ElMessage.error('更新用户信息失败，请重试')
    }
  }
}

// 监听用户数据变化
watch(() => props.userData, (newUserData) => {
  if (newUserData) {
    // 复制用户数据到表单
    Object.assign(editUserForm, newUserData)
  }
}, { immediate: true })

// 监听父组件传递的visible变化
watch(() => props.visible, (newVisible) => {
  visibleRef.value = newVisible
  if (newVisible) {
    // 对话框打开时，加载部门数据
    loadDepartments()
  }
}, { immediate: true })

// 监听本地visible变化，通知父组件
watch(visibleRef, (newVisible) => {
  emit('update:visible', newVisible)
})

// 组件挂载时加载部门数据
onMounted(() => {
  if (props.visible) {
    loadDepartments()
  }
})
</script>

<style scoped>
.edit-user-form {
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>