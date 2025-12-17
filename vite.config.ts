import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3001, // 修改前端运行端口为3000
    proxy: {
      // 将所有以/api/v1/开头的请求代理到后端服务
      '/api/v1/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  } 
})
