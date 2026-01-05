<template>
  <div class="team-list-container">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <h2>团队列表</h2>
      <div class="header-buttons">
        <el-button type="primary">新建部门</el-button>
      </div>
    </div>

    <!-- 部门列表表格 -->
    <el-table :data="departments" style="width: 100%" stripe>
      <el-table-column type="selection" width="55" />
      <el-table-column prop="name" label="部门名称" width="200" />
      <el-table-column prop="code" label="部门编号" width="150" />
      <el-table-column prop="manager_name" label="部门负责人" width="150" />

      <el-table-column prop="created_at" label="创建时间" width="180" />
      <el-table-column label="操作" width="250">
        <template #default="scope">
          <el-button size="small" type="primary" plain @click="handleView(scope.row)">查看</el-button>
          <el-button size="small" type="success" plain @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="warning" plain @click="handleTransfer(scope.row)">移交负责人</el-button>
          <el-button size="small" type="danger" plain @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Department } from '../types/index'
import { getDepartments } from '../api/team'

// 部门数据
const departments = ref<Department[]>([])

// 加载部门列表
const loadDepartments = async () => {
  try {
    const result = await getDepartments()
    // 调试：打印API返回的原始数据
    console.log('API返回的原始数据:', result)
    // 处理可能的分页响应格式（与projects API相同）
    const departmentArray = result.results ? result.results : result
    // 调试：打印处理后的数据
    console.log('处理后的数据:', departmentArray)
    // 确保返回的数据是数组，并过滤掉可能的null值
    departments.value = Array.isArray(departmentArray) ? departmentArray.filter(dept => dept !== null) : []
  } catch (error) {
    console.error('加载部门列表失败:', error)
    // 清空数据以显示No Data
    departments.value = []
  }
}

// 操作方法
const handleView = (department: Department) => {
  console.log('查看部门:', department)
}

const handleEdit = (department: Department) => {
  console.log('编辑部门:', department)
}

const handleTransfer = (department: Department) => {
  console.log('移交负责人:', department)
}

const handleDelete = (department: Department) => {
  console.log('删除部门:', department)
}

// 生命周期钩子
onMounted(() => {
  loadDepartments()
})
</script>

<style scoped>
.team-list-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
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
</style>