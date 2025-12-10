<template>
  <div class="app-container">
    <Login />
  </div>
</template>

<script setup lang="ts">
import Login from './components/Login.vue'
</script>

<style>
/* 全局样式 */
* { 
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-container {
  width: 100%;
  min-height: 100vh;
}
</style>