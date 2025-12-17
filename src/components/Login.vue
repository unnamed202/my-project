
<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <h2 class="login-title">登录</h2>
      <el-form 
        :model="loginForm" 
        :rules="loginRules" 
        ref="loginFormRef"
        label-width="80px"
        class="login-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入用户名"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleLogin" 
            :loading="loading"
            class="login-button"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { login } from '../api/auth'

// 定义登录表单数据类型
interface LoginForm {
  username: string
  password: string
}

// 登录表单数据
const loginForm = reactive<LoginForm>({
  username: '',
  password: ''
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

// 表单引用
const loginFormRef = ref()
// 加载状态
const loading = ref(false)

// 路由实例
const router = useRouter()

// 登录处理函数
  const handleLogin = async () => {
    // 表单验证
    if (!loginFormRef.value) return
    
    loginFormRef.value.validate(async (valid: boolean) => {
      if (valid) {
        loading.value = true
        
        try {
          // 调用真实的登录 API
          const response = await login(loginForm)
          
          // 登录成功后保存 token 和用户信息
          localStorage.setItem('token', response.access)
          localStorage.setItem('refreshToken', response.refresh)
          localStorage.setItem('userInfo', JSON.stringify(response.user))
          localStorage.setItem('isLoggedIn', 'true')
          
          ElMessage.success('登录成功')
          
          // 登录成功后跳转到首页或之前保存的路径
          const redirectPath = (router.currentRoute.value.query.redirect as string) || '/' 
          router.push(redirectPath)
        } catch (error) {
          // 处理登录错误
          ElMessage.error('登录失败，请检查用户名和密码')
          console.error('登录错误:', error)
        } finally {
          loading.value = false
        }
      } else {
        ElMessage.warning('请完善表单信息')
        return false
      }
    })
  }
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.login-form-wrapper {
  width: 400px;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.login-form {
  width: 100%;
}

.login-button {
  width: 100%;
  height: 40px;
  font-size: 16px;
}
</style>