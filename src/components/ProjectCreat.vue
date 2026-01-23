<template>
  <el-dialog
    v-model="dialogVisible"
    title="新建项目"
    width="900px"
    @close="handleClose"
  >
    <el-form
      ref="projectFormRef"
      :model="projectForm"
      :rules="formRules"
      label-width="100px"
      class="project-form"
    >
      <!-- 项目基本信息 -->
      <el-form-item label="项目名称" prop="name">
        <el-input v-model="projectForm.name" placeholder="请输入" maxlength="200" show-word-limit />
      </el-form-item>

      <el-form-item label="项目描述" prop="description">
        <el-input
          v-model="projectForm.description"
          type="textarea"
          placeholder="请输入"
          maxlength="1000"
          show-word-limit
          :rows="4"
        />
      </el-form-item>

      <!-- 用户选择 -->
      <el-form-item label="选择人员">
        <div class="select-users-container">
          <!-- 搜索框 -->
          <el-input
            v-model="userSearchQuery"
            placeholder="搜索成员、部门"
            prefix-icon="Search"
            clearable
            class="user-search-input"
          />
          <!-- 用户选择列表 -->
          <div class="users-list-container">
            <!-- 部门和用户列表 -->
            <div class="departments-list">
              <div
                v-for="dept in departments"
                :key="dept.id"
                class="department-item"
              >
                <div 
                  class="department-name"
                  @click="toggleDepartment(dept.id)"
                >
                  <span class="department-arrow" :class="{ 'expanded': isDepartmentExpanded(dept.id) }">▼</span>
                  {{ dept.name }}
                </div>
                <div 
                  class="department-users"
                  v-if="isDepartmentExpanded(dept.id)"
                >
                  <div
                    v-for="user in getUsersByDepartment(dept.id)"
                    :key="user.id"
                    class="user-item"
                    :class="{ 'selected': selectedUsers.includes(user.id) }"
                    @click="toggleUserSelection(user.id)"
                  >
                    <div class="user-info">
                      <div class="user-avatar">{{ user.full_name.charAt(0) }}</div>
                      <div class="user-details">
                        <div class="user-name">{{ user.full_name }}</div>
                        <div class="user-position">{{ user.position }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 已选人员列表 -->
            <div class="selected-users-container">
              <div class="selected-title">
                已选: {{ selectedUsers.length }}人
                <el-button type="text" @click="clearSelectedUsers">全部清除</el-button>
              </div>
              <div
                v-for="userId in selectedUsers"
                :key="userId"
                class="selected-user-item"
              >
                <div class="user-info">
                  <div class="user-avatar">{{ users.find(u => u.id === userId)?.full_name.charAt(0) }}</div>
                  <div class="user-details">
                    <div class="user-name">{{ users.find(u => u.id === userId)?.full_name }}</div>
                    <div class="user-role">{{ users.find(u => u.id === userId)?.role }}</div>
                  </div>
                </div>
                <el-button
                  type="text"
                  @click.stop="removeUserFromSelection(userId)"
                >
                  ×
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-form-item>

      <!-- 文件上传 -->
      <el-form-item label="立项文件">
        <el-upload
          v-model:file-list="fileList"
          action=""
          :auto-upload="false"
          :on-change="handleFileChange"
          accept=".doc,.docx,.pdf,.zip,.rar,.jpg,.jpeg"
          :before-remove="beforeRemove"
        >
          <el-button type="primary" size="small">
            <el-icon><Upload /></el-icon> 上传文件
          </el-button>
          <template #tip>
            <div class="el-upload__tip">
              支持扩展名: .rar .zip .doc .docx .pdf .jpg...
            </div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="submitting">创建</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Upload } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { createProject } from '../api/projects';
import type { ProjectCreateUpdate } from '../api/projects';
import { getUsers, getDepartments } from '../api/team';
import type { User, Department } from '../types/index';


// 属性定义
const props = defineProps<{
  modelValue: boolean;
}>();

// 事件定义
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success', project: any): void;
}>();

// 对话框可见性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val);
  }
});

// 表单引用
const projectFormRef = ref<FormInstance>();

// 表单数据
const projectForm = reactive<ProjectCreateUpdate>({
  name: '',
  description: '',
  // 其他字段保持默认值，避免接口调用时出错
  code: '',
  manager: '',
  department: '',
  status: 'planning',
  start_date: '',
  end_date: null
});

// 表单验证规则
const formRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 1, max: 200, message: '项目名称长度在 1 到 200 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入项目描述', trigger: 'blur' },
    { min: 1, max: 1000, message: '项目描述长度在 1 到 1000 个字符', trigger: 'blur' }
  ]
});

// 用户和部门数据
const users = ref<User[]>([]);
const departments = ref<Department[]>([]);
const userSearchQuery = ref('');
const selectedUsers = ref<string[]>([]);

// 部门展开状态管理
const expandedDepartments = ref<Set<string>>(new Set());

// 切换部门展开状态
const toggleDepartment = (deptId: string) => {
  if (expandedDepartments.value.has(deptId)) {
    expandedDepartments.value.delete(deptId);
  } else {
    expandedDepartments.value.add(deptId);
  }
};

// 检查部门是否展开
const isDepartmentExpanded = (deptId: string) => {
  return expandedDepartments.value.has(deptId);
};

// 过滤后的用户列表
const filteredUsers = computed(() => {
  if (!userSearchQuery.value) {
    return users.value;
  }
  return users.value.filter(user => 
    user.full_name.toLowerCase().includes(userSearchQuery.value.toLowerCase()) ||
    user.position.toLowerCase().includes(userSearchQuery.value.toLowerCase()) ||
    user.department_name.toLowerCase().includes(userSearchQuery.value.toLowerCase())
  );
});

// 根据部门获取用户
const getUsersByDepartment = (deptId: string) => {
  return filteredUsers.value.filter(user => user.department === deptId);
};

// 文件上传相关
const fileList = ref<any[]>([]);
const submitting = ref(false);

// 加载用户和部门数据
const loadData = async () => {
  try {
    const [usersData, departmentsData] = await Promise.all([
      getUsers(),
      getDepartments()
    ]);
    users.value = usersData.results;
    departments.value = departmentsData.results;
  } catch (error) {
    console.error('加载数据失败:', error);
    ElMessage.error('加载数据失败，请重试');
  }
};

// 处理对话框关闭
const handleClose = () => {
  resetForm();
  emit('update:modelValue', false);
};

// 重置表单
const resetForm = () => {
  if (projectFormRef.value) {
    projectFormRef.value.resetFields();
  }
  projectForm.status = 'planning';
  selectedUsers.value = [];
  fileList.value = [];
  userSearchQuery.value = '';
};

// 处理文件变更
const handleFileChange = (file: any) => {
  console.log('File changed:', file);
};

// 移除文件前确认
const beforeRemove = (file: any) => {
  return ElMessageBox.confirm(`确定要移除文件 ${file.name} 吗？`).then(
    () => true,
    () => false
  );
};

// 处理创建项目
const handleCreate = async () => {
  if (!projectFormRef.value) return;
  
  try {
    await projectFormRef.value.validate();
    submitting.value = true;
    
    // 创建项目
    const project = await createProject({
      ...projectForm,
      manager: users.value.find(u => u.id === projectForm.manager)?.full_name || '',
      department: departments.value.find(d => d.id === projectForm.department)?.name || '',
      //created_by: '', // 这个应该从登录用户信息中获取
      //created_by_name: '' // 这个应该从登录用户信息中获取
    });
    
    // TODO: 处理文件上传和用户添加
    
    ElMessage.success('项目创建成功');
    emit('success', project);
    handleClose();
  } catch (error: any) {
    console.error('创建项目失败:', error);
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message);
    } else if (error.message) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error('创建项目失败，请重试');
    }
  } finally {
    submitting.value = false;
  }
};

// 清除已选用户
const clearSelectedUsers = () => {
  selectedUsers.value = [];
};

// 切换用户选择状态
const toggleUserSelection = (userId: string) => {
  const index = selectedUsers.value.indexOf(userId);
  if (index > -1) {
    selectedUsers.value.splice(index, 1);
  } else {
    selectedUsers.value.push(userId);
  }
};

// 从已选列表中移除用户
const removeUserFromSelection = (userId: string) => {
  const index = selectedUsers.value.indexOf(userId);
  if (index > -1) {
    selectedUsers.value.splice(index, 1);
  }
};

// 监听modelValue属性变化
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    loadData();
  }
}, { immediate: true });
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.mb-2 {
  margin-bottom: 10px;
}

.mt-2 {
  margin-top: 10px;
}

/* 用户选择界面样式 */
.select-users-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  width: 100%;
}

.user-search-input {
  border-bottom: 1px solid #dcdfe6;
  margin: 0;
}

.users-list-container {
  display: flex;
  height: 350px;
  overflow: hidden;
}

.departments-list {
  width: 50%;
  padding: 10px;
  overflow-y: auto;
  border-right: 1px solid #dcdfe6;
}

.department-item {
  margin-bottom: 15px;
}

.department-name {
  font-weight: bold;
  margin-bottom: 8px;
  color: #606266;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 5px 0;
  transition: color 0.2s;
  font-size: 20px;
}

.department-name:hover {
  color: #409eff;
}

.department-arrow {
  font-size: 10px;
  margin-right: 5px;
  transition: transform 0.2s;
  transform: rotate(-90deg);
}

.department-arrow.expanded {
  transform: rotate(0deg);
}

.department-users {
  margin-left: 15px;
  margin-bottom: 10px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 4px;
}

.user-item:hover {
  background-color: #f5f7fa;
}

.user-item.selected {
  background-color: #ecf5ff;
  border: 1px solid #409eff;
}

.user-info {
  display: flex;
  align-items: center;
  width: 100%;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.user-role {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.selected-users-container {
  width: 45%;
  padding: 10px;
  overflow-y: auto;
}

.selected-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #606266;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-radius: 4px;
  background-color: #f5f7fa;
  margin-bottom: 8px;
}
</style>