import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Layout from '../components/Layout.vue'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/',
      name: 'Layout',
      component: Layout,
      meta: { requiresAuth: true }, // 添加需要登录的标记
      children: [
        {
          path: '',
          name: 'Home',
          component: Home
        },
        // 其他路由可以在这里添加
       /* {
          path: 'team',
          name: 'Team',
          component: () => import('../components/Team.vue') // 懒加载
        },
        {
          path: 'todo',
          name: 'Todo',
          component: () => import('../components/Todo.vue') // 懒加载
        },
        {
          path: 'project/:id',
          name: 'ProjectDetail',
          component: () => import('../components/ProjectDetail.vue') // 懒加载
        } */
      ]
    }
  ]
})

// 路由守卫：检查是否需要登录
router.beforeEach((to, _, next) => {
  // 检查路由是否需要登录
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 检查是否已经登录（使用localStorage存储登录状态）
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    
    if (isLoggedIn) {
      // 已登录，继续导航
      next()
    } else {
      // 未登录，重定向到登录页面
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存当前路径，以便登录后跳转回来
      })
    }
  } else {
    // 不需要登录的路由，直接导航
    next()
  }
})

export default router